import dayjs from "dayjs";
import urlSlug from "url-slug";
import { NodeHtmlMarkdown } from "node-html-markdown"; // NodeHtmlMarkdownOptions
import { usePapaParse } from "react-papaparse";

const fetchDriveList = async (
  driveFolderId,
  maxResults,
  addDateToSlug = true
) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const sort = "createdTime desc";
  const fields =
    "files(id,kind,createdTime,name,version,thumbnailLink,starred,exportLinks)";

  const filesApiUrl = `https://www.googleapis.com/drive/v3/files/?q="${driveFolderId}"+in+parents&orderBy=${sort}&fields=${fields}&pageSize=${maxResults}&key=${apiKey}`;
  const request = await fetch(filesApiUrl);
  const newsData = await request.json();

  const filesList =
    newsData &&
    newsData.files &&
    newsData.files.map((file) => {
      return {
        ...file,
        slug: `${
          addDateToSlug ? dayjs(file.createdTime).format("YYYY-MM-DD-") : ""
        }${urlSlug(file.name)}`,
      };
    });

  return filesList;
};

const parseDocumentData = async (fileData) => {
  if (!fileData) return null;

  const getHtml = await fetch(fileData.exportLinks["text/html"]).then((res) =>
    res.text()
  );

  //const pattern = /<body(.)*>(.*?)<\/body>/im;
  //const getHtmlBody = pattern.exec(getHtml)[0];
  // TODO:   find classes and parse them... .c17{font-weight:500} => <strong></strong>, etc...

  return {
    ...fileData,
    mdText: NodeHtmlMarkdown.translate(getHtml, {}),
    html: getHtml,
  };
};

const parseTableData = async (fileData) => {
  const { readString } = usePapaParse();
  const rawCsv = await fetch(fileData.exportLinks["text/csv"]).then((res) =>
    res.text()
  );

  const { data: csvData } = await readString(rawCsv);

  return {
    ...fileData,
    csvData,
    rawCsv,
  };
};

export { fetchDriveList, parseDocumentData, parseTableData };
