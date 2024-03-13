let nav = 0; // current month - 1
let clicked = null; // clicked date
let dateTimeEvents = [];
let dateEvents = [];
let tasks = [];
let year, month, date;
let client;
let access_token;
let googleResponse;

const dayGrid = document.getElementById("dayGrid");
const newEventModal = document.getElementById("newEventModal");
const deleteEventModal = document.getElementById("deleteEventModal");
const backDrop = document.getElementById("modalBackDrop");
const eventTitleInput = document.getElementById("eventTitleInput");
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const CLIENT_ID =
  "1039492430904-8q81bvrg1bt8fslph292sfiqkp58a9t3.apps.googleusercontent.com";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

function initClient() {
  client = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      access_token = tokenResponse.access_token;

      localStorage.setItem("access_token", access_token);

      console.log("got access token");
      loadCalendar();
    },
    auto_select: true,
  });
}

function getToken() {
  client.requestAccessToken();
}

function revokeToken() {
  google.accounts.oauth2.revoke(access_token, () => {
    console.log("access token revoked");
  });
}

function updateDate() {
  const dt = new Date();

  if (nav !== 0) {
    dt.setMonth(new Date().getMonth() + nav);
  }

  day = dt.getDate();
  month = dt.getMonth();
  year = dt.getFullYear();
}

function loadCalendar() {
  if (localStorage.getItem("access_token")) {
    access_token = localStorage.getItem("access_token");
  }

  if (client === undefined || access_token === undefined) {
    if (client === undefined) console.log("Client not set.");
    if (access_token === undefined) console.log("access token not set.");
    return;
  }

  let xhr = new XMLHttpRequest();

  let timeMin = new Date(year, month - 1, 1).toISOString();
  let timeMax = new Date(year, month + 2, 0).toISOString();

  // URL에 쿼리 파라미터 추가
  let url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&timeMax=${encodeURIComponent(
    timeMax
  )}&orderBy=startTime&showDeleted=false&singleEvents=true`; //!!!!!!!!
  console.log(url);
  xhr.open("GET", url);
  xhr.setRequestHeader("Authorization", "Bearer " + access_token);

  xhr.onreadystatechange = function () {
    // 요청이 완료되었는지 확인
    if (xhr.readyState === XMLHttpRequest.DONE) {
      // HTTP 요청이 성공적으로 완료되었는지 확인
      if (xhr.status === 200) {
        // 성공적으로 응답을 받았을 경우, 응답을 파싱하여 처리
        let response = JSON.parse(xhr.responseText);

        console.log("Calendar events:", response);

        const googleEvents = response.items;
        googleResponse = response.items;
        if (!googleEvents || googleEvents.length == 0) {
          // document.getElementById('content').innerText = 'No googleEvents found.';
          return;
        }
        let modifiedEvents = googleEvents.map((event) => ({
          title: event.summary,
          isAllDay: event.start.dateTime === undefined,
          startDate: !event.start.dateTime
            ? new Date(event.start.date).toLocaleDateString("en-us")
            : new Date(event.start.dateTime).toLocaleDateString("en-us"),
          endDate: !event.start.dateTime
            ? new Date(event.end.date).toLocaleDateString("en-us")
            : new Date(event.end.dateTime).toLocaleDateString("en-us"),
          startDateTime: event.start.dateTime
            ? new Date(event.end.dateTime).toLocaleString("en-us")
            : undefined,
          endDateTime: event.start.dateTime
            ? new Date(event.end.dateTime).toLocaleString("en-us")
            : undefined,
        }));

        for (let key in modifiedEvents) {
          if (modifiedEvents[key].isAllDay) {
            dateEvents.push(modifiedEvents[key]);
          } else {
            dateTimeEvents.push(modifiedEvents[key]);
          }
        }

        load();
      } else {
        console.error("Failed to load calendar events, status: " + xhr.status);
      }
    }
  };
  xhr.send();
}

// function openModal(date) {
//   clicked = date;

//   const eventForDay = events.find((e) => e.date == clicked);

//   if (eventForDay) {
//     document.getElementById("eventText").innerText = eventForDay.title;
//     deleteEventModal.style.display = "block";
//   } else {
//     newEventModal.style.display = "block";
//   }
//   backDrop.style.display = "block";
// }

function load() {
  const dt = new Date(year, month, day);
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  const daysInLastMonth = new Date(year, month, 0).getDate();

  document.getElementById("monthDisplay").innerText = `${dt.toLocaleDateString(
    "en-us",
    { month: "short" }
  )} ${year}`;

  const paddingDays = weekdays.indexOf(
    firstDayOfMonth.toLocaleDateString("en-us", {
      weekday: "long",
    })
  );

  dayGrid.innerHTML = "";

  let dayDisplayed = 0;

  /* last month */
  for (; dayDisplayed < paddingDays; dayDisplayed++) {
    const daySquare = document.createElement("div");
    daySquare.classList.add("paddingDay");
    daySquare.innerText = daysInLastMonth - paddingDays + dayDisplayed + 1;
    dayGrid.appendChild(daySquare);
  }

  /* this month */
  for (; dayDisplayed - paddingDays < daysInThisMonth; dayDisplayed++) {
    const thisDay = dayDisplayed - paddingDays + 1;
    const daySquare = document.createElement("div");
    daySquare.classList.add("day");
    daySquare.innerText = thisDay;

    if (dayDisplayed - paddingDays === day && nav === 0) {
      daySquare.id = "currentDay";
    }

    const thisDateString = `${month + 1}/${thisDay}/${year}`;
    const dateEventsForDay = dateEvents.filter(
      (e) => e.startDate <= thisDateString && thisDateString < e.endDate
    );

    // const dateTimeString = `${month + 1}/${thisDay}/${year}`;
    const dateTimeEventsForDay = dateTimeEvents.filter(
      (e) => e.startDate <= thisDateString && thisDateString <= e.endDate
    );

    let eventsDisplayed = 0;
    let eventsNotDisplayed = 0;

    for (const key in dateEventsForDay) {
      if (eventsDisplayed >= 4) {
        ++eventsNotDisplayed;
      } else {
        const eventDiv = document.createElement("div");
        eventDiv.classList.add("dateEvent");
        eventDiv.innerText = dateEventsForDay[key].title;
        daySquare.appendChild(eventDiv);
        ++eventsDisplayed;
      }
    }

    for (const key in dateTimeEventsForDay) {
      if (eventsDisplayed >= 4) {
        ++eventsNotDisplayed;
      } else {
        const eventDiv = document.createElement("div");
        eventDiv.classList.add("dateTimeEvent");
        eventDiv.innerText = dateTimeEventsForDay[key].title;
        daySquare.appendChild(eventDiv);
        ++eventsDisplayed;
      }
    }

    if (eventsNotDisplayed) {
      const eventDiv = document.createElement("div");
      eventDiv.classList.add("moreEvent");
      eventDiv.innerText = "+ " + eventsNotDisplayed + " more";
      daySquare.appendChild(eventDiv);
    }

    // daySquare.addEventListener("click", () =>
    //   openModal(`${month + 1}/${thisDay}/${year}`)
    // );

    dayGrid.appendChild(daySquare);
  }

  /* next month */
  for (; dayDisplayed % 7 != 0; dayDisplayed++) {
    const daySquare = document.createElement("div");
    daySquare.classList.add("paddingDay");
    daySquare.innerText = dayDisplayed % 7;
    dayGrid.appendChild(daySquare);
  }
}

// function saveEvent() {
//   if (eventTitleInput.value) {
//     eventTitleInput.classList.remove("error");
//     events.push({
//       date: clicked,
//       title: eventTitleInput.value,
//     });

//     localStorage.setItem("events", JSON.stringify(events));
//     closeModal();
//   } else {
//     eventTitleInput.classList.add("error");
//   }
// }

// function closeModal() {
//   eventTitleInput.classList.remove("error");
//   newEventModal.style.display = "none";
//   deleteEventModal.style.display = "none";
//   backDrop.style.display = "none";
//   eventTitleInput.value = "";
//   clicked = null;
//   load();
// }

// function deleteEvent() {
//   events = events.filter((e) => e.date !== clicked);
//   localStorage.setItem("events", JSON.stringify(events));
//   closeModal();
// }

function initButtons() {
  document.getElementById("nextButton").addEventListener("click", () => {
    nav++;
    events = [];
    updateDate();
    loadCalendar();
    load();
  });
  document.getElementById("backButton").addEventListener("click", () => {
    nav--;
    events = [];
    updateDate();
    loadCalendar();
    load();
  });

  document.getElementById("loginButton").addEventListener("click", getToken);

  // document.getElementById("saveButton").addEventListener("click", saveEvent);
  // document.getElementById("cancelButton").addEventListener("click", closeModal);

  // document
  //   .getElementById("deleteButton")
  //   .addEventListener("click", deleteEvent);
  // document.getElementById("closeButton").addEventListener("click", closeModal);
}

initClient();
initButtons();
updateDate();
load();
loadCalendar();
