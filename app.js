require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const oAuthClient = new OAuth2(process.env.CLIENT_ID, process.env.SECRET_ID);
oAuthClient.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});
app.get("/", (req, res) => {
  res.render("landing");
});
app.get("/add-events", (req, res) => {
  res.render("index");
});
app.post("/events", (req, res) => {
  const varDate = new Date(req.body.date);
  const date = varDate.getDate();
  const month = varDate.getMonth();
  const year = varDate.getFullYear();
  const startHour = req.body.startHour;
  const startMin = req.body.startMin;
  const endHour = req.body.endHour;
  const endMin = req.body.endMin;
  const eventStartTime = new Date(year, month, date, startHour, startMin);

  const eventEndTime = new Date(year, month, date, endHour, endMin);

  console.log("calendar created");
  if (startHour == endHour) {
    if (startMin < endMin) {
      const calender = google.calendar({
        version: "v3",
        auth: oAuthClient,
      });
      const event = {
        summary: req.body.summary,
        description: req.body.description,
        start: {
          dateTime: eventStartTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: eventEndTime,
          timeZone: "Asia/Kolkata",
        },
        attendees: [{ email: req.body.email }],
        reminders: {
          useDefault: true,
        },
        colorId: 1,
      };
      console.log("Event Created");
      calender.freebusy.query(
        {
          resource: {
            timeMin: eventStartTime,
            timeMax: eventEndTime,
            timeZone: "Asia/Kolkata",
            items: [{ id: "primary" }],
          },
        },
        (err, response) => {
          if (err) {
            console.log("free busy error");
            console.error("FREE BUSY ERROR: ", err);
            const message = {
              title: "something wrong with freeBusy method",
            };
            res.render("error", { message: message });
          }

          const eventsArr = response.data.calendars.primary.busy;
          if (eventsArr.length === 0) {
            console.log("Event arr length is not 0");
            calender.events.insert(
              {
                calendarId: "primary",
                resource: event,
                auth: oAuthClient,
                sendNotifications: true,
              },
              (err) => {
                if (err) {
                  console.log("calendar event error");
                  console.error("CALENDER EVENT ERROR: ", err);
                  const message = { title: "Calendar Event Error" };
                  res.render("error", { message: message });
                } else {
                  console.log("everything went right");
                  res.render("success");
                }
              }
            );
          } else {
            console.log("event array is busy", eventArr);
            const message = { title: "You are busy on that day" };
            res.render("error", { message: message });
          }
        }
      );
    } else {
      console.log("startmin is not less than endMin");
      const message = { title: "Start minute is not less than end minute" };
      res.render("error", { message: message });
    }
  } else if (endHour > startHour) {
    const calender = google.calendar({
      version: "v3",
      auth: oAuthClient,
    });
    const event = {
      summary: req.body.summary,
      description: req.body.description,
      start: {
        dateTime: eventStartTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: eventEndTime,
        timeZone: "Asia/Kolkata",
      },
      attendees: [{ email: req.body.email }],
      reminders: {
        useDefault: true,
      },
      colorId: 1,
    };
    console.log("event created");
    calender.freebusy.query(
      {
        resource: {
          timeMin: eventStartTime,
          timeMax: eventEndTime,
          timeZone: "Asia/Kolkata",
          items: [{ id: "primary" }],
        },
      },
      (err, response) => {
        if (err) {
          console.log("free busy error");
          console.error("FREE BUSY ERROR: ", err);
          const message = {
            title: "Something wrong with freeBusy method",
          };
          res.render("error", { message: message });
        }
        console.log(response);
        const eventsArr = response.data.calendars.primary.busy;
        if (eventsArr.length === 0) {
          console.log("Event arr length is not 0");
          calender.events.insert(
            {
              calendarId: "primary",
              resource: event,
              auth: oAuthClient,
              sendNotifications: true,
            },
            (err) => {
              if (err) {
                console.log("calendar event error");
                console.error("CALENDER EVENT ERROR: ", err);
                const message = { title: "Celendar Event Error" };
                res.render("error", { message: message });
              } else {
                console.log("everything went right");
                res.render("success");
              }
            }
          );
        } else {
          console.log("event array is busy", eventArr);
          const message = { title: "You are busy on that day" };
          res.render("error", { message: message });
        }
      }
    );
  } else {
    const message = { title: "start and end timing is incorrect" };
    res.render("error", { message: message });
  }
});
app.get("/get-my-events", (req, res) => {
  listEvents(oAuthClient);
});

app.listen(3000, () => {
  console.log("the calendar app is running");
});
function listEvents(auth) {
  console.log("Function invoked");
  const calendar = google.calendar({ version: "v3", auth });
  console.log("calendar created");
  calendar.events.list(
    {
      calendarId: "primary",
      // timeMin: (new Date()).toISOString(),
      // maxResults: 10,
      // singleEvents: true,
      // orderBy: 'startTime',
    },
    (err, response) => {
      if (err) return console.log("The API returned an error: " + err);
      console.log("No error till events");
      const events = response.data.items;
      if (events.length) {
        console.log("Upcoming 10 events:");
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date;
          console.log(`${start} - ${event.summary}`);
        });
      } else {
        console.log("No upcoming events found.");
      }
    }
  );
}
