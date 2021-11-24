import { isEmpty } from "lodash/isEmpty";
import dayjs from "dayjs";
import urlSlug from "url-slug";

const parseDescriptionText = (string) => {
  const splitted = string && string.split(/(==[a-zA-Z]{2,3}==)/gim);

  if (splitted && !isEmpty(splitted[0])) {
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
  const now = dayjs();
  const timeMin = dayjs().add(-1, "day").format("YYYY-MM-DDTHH:mm:ss");
  const timeMax = dayjs().add(maxDays, "days").format("YYYY-MM-DDTHH:mm:ss");
  const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${scheduleGoogleCalendarID}/events?orderBy=startTime&singleEvents=true&maxResults=${maxResults}&timeMin=${timeMin}Z&timeMax=${timeMax}Z&key=${apiKey}`;

  const request = await fetch(calendarApiUrl);
  const calendarData = await request.json();

  const schedule =
    calendarData &&
    calendarData.items &&
    calendarData.items.filter((item) => {
      const end = dayjs(item.end.dateTime);
      const start = dayjs(item.start.dateTime);
      return start > now ? true : end > now ? true : false;
    });

  return schedule
    ? schedule.map((item) => {
        return {
          id: item.id,
          slug: `${dayjs(item.start.dateTime).format("YYYY-MM-DD")}-${urlSlug(
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

export { parseDescriptionText, fetchCalendarData };

/*
* Event description format:
==cs==
Ahoj, jak se mas?

==en==
Hello, how are you?
*/
