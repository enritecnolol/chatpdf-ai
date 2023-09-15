import {
  PineconeClient,
  Vector,
  utils as PineconeUtils,
} from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbedding } from "./embeddings";
import md5 from "md5";
import { convertToAscii } from "./utils";

let pinecone: PineconeClient | null = null;

// Function to load S3 file into Pinecone
export const getPineconeClient = async () => {
  if (!pinecone) {
    pinecone = await new PineconeClient();
    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    })
  }

  return pinecone;
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: {
      pageNumber: number;
    };
  };
};

// Function to load S3 file into Pinecone
export async function loadS3IntoPinecone(fileKey: string) {
  // obtain pdf
  console.log("downloading s3 into file system");
  const file_name = await downloadFromS3(fileKey);
  if (!file_name) {
    throw new Error("could not download from S3");
  }
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  //split and segment pdf
  const documents = await Promise.all(pages.map(prepareDocument));

  //vectorise and embed individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));

  // upload to pinecone
  const client = await getPineconeClient();
  const pineconeIndex = client.Index("chatpdf-ai");

  console.log("inserting vectors into pinecone");
  const namespace = convertToAscii(fileKey);

  PineconeUtils.chunkedUpsert(pineconeIndex, vectors, namespace, 10);
  return documents[0];
}

// Function to embed a document
async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbedding(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as Vector;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

// Function to truncate a string by bytes
export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

// Function to prepare a document
async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  //split the Docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);

  return docs;
}
