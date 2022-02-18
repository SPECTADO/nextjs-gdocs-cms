(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('dayjs'), require('url-slug'), require('node-html-markdown'), require('react-papaparse'), require('lodash/isEmpty')) :
  typeof define === 'function' && define.amd ? define(['dayjs', 'url-slug', 'node-html-markdown', 'react-papaparse', 'lodash/isEmpty'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["nextjs-gdocs-cms"] = factory(global.dayjs, global["url-slug"], global.NodeHtmlMarkdown, global.usePapaParse, global.isEmpty));
})(this, (function (dayjs, urlSlug, nodeHtmlMarkdown, reactPapaparse, isEmpty) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var dayjs__default = /*#__PURE__*/_interopDefaultLegacy(dayjs);
  var urlSlug__default = /*#__PURE__*/_interopDefaultLegacy(urlSlug);

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
          addDateToSlug ? dayjs__default["default"](file.createdTime).format("YYYY-MM-DD-") : ""
        }${urlSlug__default["default"](file.name)}`,
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
      mdText: nodeHtmlMarkdown.NodeHtmlMarkdown.translate(getHtml, {}),
      html: getHtml,
    };
  };

  const parseTableData = async (fileData) => {
    const { readString } = reactPapaparse.usePapaParse();
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

  const parseDescriptionText = (string) => {
    const splitted = string && string.split(/(==[a-zA-Z]{2,3}==)/gim);

    if (splitted && !isEmpty.isEmpty(splitted[0])) {
      return splitted[0].trim();
    }

    const extendedDesc = {};
    splitted &&
      splitted.forEach((item, index) => {
        const test = /(==)([a-zA-Z]{2,3})(==)/gi.test(item);
        const token = item.replace(/==/g, "");

        if (test) {
          extendedDesc[token] = splitted[index + 1].trim();
        }
      });

    return extendedDesc;
  };

  const trimLocation = (location) => {
    const locSplit = location.split(",");
    return locSplit[0];
  };

  const fetchCalendarData = async (
    scheduleGoogleCalendarID,
    maxDays,
    maxResults
  ) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    const now = dayjs__default["default"]();
    const timeMin = dayjs__default["default"]().add(-1, "day").format("YYYY-MM-DDTHH:mm:ss");
    const timeMax = dayjs__default["default"]().add(maxDays, "days").format("YYYY-MM-DDTHH:mm:ss");
    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${scheduleGoogleCalendarID}/events?orderBy=startTime&singleEvents=true&maxResults=${maxResults}&timeMin=${timeMin}Z&timeMax=${timeMax}Z&key=${apiKey}`;

    const request = await fetch(calendarApiUrl);
    const calendarData = await request.json();

    const schedule =
      calendarData &&
      calendarData.items &&
      calendarData.items.filter((item) => {
        const end = dayjs__default["default"](item.end.dateTime);
        const start = dayjs__default["default"](item.start.dateTime);
        return start > now ? true : end > now ? true : false;
      });

    return schedule
      ? schedule.map((item) => {
          return {
            id: item.id,
            slug: `${dayjs__default["default"](item.start.dateTime).format("YYYY-MM-DD")}-${urlSlug__default["default"](
            item.summary,
            { camelCase: false }
          )}`,
            title: item.summary,
            description: parseDescriptionText(item.description),
            location: item.location,
            locationShort: trimLocation(item.location),
            locationGps: {},
            start: item.start.dateTime,
            end: item.end.dateTime,

            //_dbg: item,
            //_dbg: calendarApiUrl,
          };
        })
      : null;
  };

  /*
  * Event description format:
  ==cs==
  Ahoj, jak se mas?

  ==en==
  Hello, how are you?
  */

  var index = {
    fetchDriveList,
    parseDocumentData,
    parseTableData,
    fetchCalendarData,
    parseDescriptionText,
  };

  return index;

}));
