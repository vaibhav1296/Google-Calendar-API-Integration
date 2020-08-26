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
  if (startHour <= endHour && startMin <= endMin) {
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
          res.render("error");
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
                res.render("error");
              } else {
                console.log("everything went right");
                res.render("success");
              }
            }
          );
        }
        console.log("Sorry boss I am busy", eventsArr);
      }
    );
  } else {
    console.log("katai alag error");
    res.render("error");
  }
});

app.listen(3000, () => {
  console.log("the calendar app is running");
});
