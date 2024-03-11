let nav = 0; // current month - 1
let clicked = null; // clicked date
let events = [];
let year, month, date;
let client;
let access_token;
let googleResponse;

const calendar = document.getElementById("calendar");
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

const CLIENT_ID = "1039492430904-8q81bvrg1bt8fslph292sfiqkp58a9t3.apps.googleusercontent.com";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";


function initClient() {
	client = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: (tokenResponse) => {
			access_token = tokenResponse.access_token;
		},
		auto_select: true,
	});
}

function getToken() {
	client.requestAccessToken();
}

function revokeToken() {
	google.accounts.oauth2.revoke(access_token, () => {console.log('access token revoked')});
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
	if (client === undefined || access_token === undefined)
		return;

	let xhr = new XMLHttpRequest();

	let timeMin = new Date(year, month, 1).toISOString();
	let timeMax = new Date(year, month + 1, 0).toISOString();

	// URL에 쿼리 파라미터 추가
	let url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&orderBy=startTime&showDeleted=false&singleEvents=true`; //!!!!!!!!
	console.log(url);
	xhr.open('GET', url);
	xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);

	xhr.onreadystatechange = function() {
		// 요청이 완료되었는지 확인
		if (xhr.readyState === XMLHttpRequest.DONE) {
			// HTTP 요청이 성공적으로 완료되었는지 확인
			if (xhr.status === 200) {
				// 성공적으로 응답을 받았을 경우, 응답을 파싱하여 처리
				let response = JSON.parse(xhr.responseText);
				
				console.log('Calendar events:', response);

				const googleEvents = response.items;
				googleResponse = response.items;
				if (!googleEvents || googleEvents.length == 0) {
					// document.getElementById('content').innerText = 'No googleEvents found.';
					return;
				}
				let modifiedEvents = googleEvents.map(event => ({
					date: new Date(event.start.dateTime || event.start.date).toLocaleDateString("en-us", {
					  year: "numeric",
					  month: "numeric",
					  day: "numeric",
					}),
					title: event.summary,
				  }));

				for (let key in modifiedEvents) {
					events.push(modifiedEvents[key]);
				}

			  load();

				// 여기에서 응답을 기반으로 UI를 업데이트하거나 다른 처리를 수행
			} else {
				// 오류 처리
				console.error('Failed to load calendar events, status: ' + xhr.status);
			}
		}
	};
	xhr.send();
}


function openModal(date) {
  clicked = date;

  const eventForDay = events.find((e) => e.date == clicked);

  if (eventForDay) {
    document.getElementById("eventText").innerText = eventForDay.title;
    deleteEventModal.style.display = "block";
  } else {
    newEventModal.style.display = "block";
  }
  backDrop.style.display = "block";
}

function load() {
	loadEventsToCalendar();
	console.log("load");
}

function loadEventsToCalendar() {
  const dt = new Date(year, month, day);
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dateString = firstDayOfMonth.toLocaleDateString("en-us", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const paddingDays = weekdays.indexOf(dateString.split(", ")[0]);

  document.getElementById("monthDisplay").innerText = `${dt.toLocaleDateString(
    "en-us",
    { month: "long" }
  )} ${year}`;

  calendar.innerHTML = "";

  for (let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement("div");
    daySquare.classList.add("day");

    const dayString = `${month + 1}/${i - paddingDays}/${year}`;
    if (i > paddingDays) {
      daySquare.innerText = i - paddingDays;

      const eventsForDay = events.filter((e) => e.date === dayString);

      if (i - paddingDays === day && nav === 0) {
        daySquare.id = "currentDay";
      }

      eventsForDay.forEach((eventForDay) => {
        const eventDiv = document.createElement("div");
        eventDiv.classList.add("event");
        eventDiv.innerText = eventForDay.title;
        daySquare.appendChild(eventDiv);
      });

      daySquare.addEventListener("click", () =>
        openModal(`${month + 1}/${i - paddingDays}/${year}`)
      );
    } else {
      daySquare.classList.add("padding");
    }

    calendar.appendChild(daySquare);
  }
  console.log(paddingDays);
  console.log(dateString);
}

function saveEvent() {
  if (eventTitleInput.value) {
    eventTitleInput.classList.remove("error");
    events.push({
      date: clicked,
      title: eventTitleInput.value,
    });

    localStorage.setItem("events", JSON.stringify(events));
    closeModal();
  } else {
    eventTitleInput.classList.add("error");
  }
}

function closeModal() {
  eventTitleInput.classList.remove("error");
  newEventModal.style.display = "none";
  deleteEventModal.style.display = "none";
  backDrop.style.display = "none";
  eventTitleInput.value = "";
  clicked = null;
  load();
}

function deleteEvent() {
  events = events.filter((e) => e.date !== clicked);
  localStorage.setItem("events", JSON.stringify(events));
  closeModal();
}

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

  document.getElementById("saveButton").addEventListener("click", saveEvent);
  document.getElementById("cancelButton").addEventListener("click", closeModal);

  document
    .getElementById("deleteButton")
    .addEventListener("click", deleteEvent);
  document.getElementById("closeButton").addEventListener("click", closeModal);
}

initButtons();
updateDate();  
load();
