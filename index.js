const {ipcRenderer} = require('electron')

let seasons = [];
let events = [];

let characterUrl = "http://www.pathofexile.com/character-window/get-characters?accountName=";
let ladderUrl = "http://api.pathofexile.com/ladders";
let seasonsUrl = "http://www.pathofexile.com/api/seasons";
let eventsUrl = "http://api.pathofexile.com/leagues?type=season";

let accountName = "";
let characterName = "";
let seasonName = "";
let eventName = "";

let league;
let level;
let previousRank;
let rank;
let classRank;

let ladder = [];
let minLevel = 1;
let minEp = 0;
let total = 0;

let colors = { same: "#999933", up: "#339933", down: "#993333" };
let elements;

function init(){
    elements = {
        account: document.getElementById('account'),
        name: document.getElementById('name'),
        rank: document.getElementById('rank'),
        rankChange: document.getElementById('rankChange'),
        rankClass: document.getElementById('rankClass'),
        rankClassChange: document.getElementById('rankClassChange'),
        minLevel: document.getElementById('minLevel'),
        minEp: document.getElementById('minEp'),
        updatedOn: document.getElementById('updatedOn'),
        season: document.getElementById('season'),
        event: document.getElementById('event')
    };
    document.getElementById('frame').addEventListener('click', () => {
        ipcRenderer.send("toggle-frame", {
            rank: { text: elements.rank.innerText, display: elements.rank.style.display },
            rankChange: { text: elements.rankChange.innerText, display: elements.rankChange.style.display },
            rankClass: { text: elements.rankClass.innerText, display: elements.rankClass.style.display },
            rankClassChange: { text: elements.rankClassChange.innerText, display: elements.rankClassChange.style.display },
            minLevel: { text: elements.minLevel.innerText, display: elements.minLevel.style.display },
            minEp: { text: elements.minEp.innerText, display: elements.minEp.style.display },
            updatedOn: { text: elements.updatedOn.innerText, display: elements.updatedOn.style.display },
            frame: elements.account.style.display == "none",
            accountName: accountName,
            characterName: characterName,
            seasonName: seasonName,
            eventName: eventName,
            seasons: seasons,
            events: events
        });
    });
    elements.season.addEventListener('change', (e) => {
        while(elements.event.length != 1) elements.event.remove(1);
        events = [];
        elements.event.disabled = true;
        elements.event.value = "";
        eventName = "";
        seasonName = e.currentTarget.value;
        if(seasonName == "") return;
        fetchEvents(0);
    });
    elements.event.addEventListener('change', (e) => {
        eventName = e.currentTarget.value;
        if(eventName == "") return;
    });
    elements.name.addEventListener('change', (e) => {
        characterName = e.currentTarget.value;
    });
    elements.account.addEventListener('change', (e) => {
        accountName = e.currentTarget.value;
    });
    window.setTimeout(fetchSeasons, 1000);
}

function fetchSeasons(){
    if(seasons.length != 0) return;
    elements.updatedOn.innerText = "Fetching seasons...";
    let req = new XMLHttpRequest();
    req.open("GET",seasonsUrl);
    req.onloadend = () => {
        if(req.status != 200){
            window.setTimeout(fetchSeasons, 10000);
            return;
        }
        let d = JSON.parse(req.responseText);
        if(!d || d.length == 0){
            elements.updatedOn.innerText = "Seasons unavailable";
            return;
        }
        for(let i = 0; i < d.length; i++){
            if(!d[i].configEditorId) continue;
            seasons.push(d[i].configEditorId);
        }
        elements.updatedOn.innerText = "";
        displaySeasons();
        elements.season.disabled = false;
    }
    req.send();
}

function displaySeasons(){
    seasons = seasons.sort((a,b) => a.localeCompare(b));
    for(let i = 0; i < seasons.length; i++){
        let opt = document.createElement("option");
        opt.text = seasons[i];
        elements.season.add(opt);
    }
}

function fetchEvents(offset){
    elements.updatedOn.innerText = "Fetching events...";
    let url = eventsUrl + "&season=" + seasonName + "&offset=" + offset + "&compact=1";
    let req = new XMLHttpRequest();
    req.open("GET", url);
    req.onloadend = () => {
        if(req.status != 200){
            window.setTimeout(() => { fetchEvents(offset); }, 30000);
            return;
        }
        let d = JSON.parse(req.responseText);
        if(d.length == 0) {
            elements.updatedOn.innerText = "";
            displayEvents();
            elements.event.disabled = false;
            return;
        }
        for(let i = 0; i < d.length; i++){
            events.push(d[i].id);
        }
        window.setTimeout(() => { fetchEvents(offset + d.length); }, 500);
    }
    req.send();
}

function displayEvents(){
    events = events.sort((a,b) => a.localeCompare(b));
    for(let i = 0; i < events.length; i++){
        let opt = document.createElement("option");
        opt.text = events[i];
        elements.event.add(opt);
    }
}

function getCharacter() {
    if(!characterName){
        elements.updatedOn.innerText = "Character name required";
        return;
    }
    else if(!accountName && !eventName){
        elements.updatedOn.innerText = "Account name or event required";
        return;
    }
    else if(!accountName){
        level = 0;
        league = "";
        buildList();
        return;
    }
    let req = new XMLHttpRequest();
    req.open("GET", characterUrl + accountName);
    req.onloadend = () => {
        if(req.status != 200){
            win.setTimeout(getCharacter, 10000);
            return;
        }
        let d = JSON.parse(req.responseText);
        if(!d){
            elements.updatedOn.innerText = "Account is private";
            return;
        }
        let c = d.find((x) => x.name == characterName);
        if(!c){
            elements.updatedOn.innerText = "Invalid character";
            return;
        }
        else{
            league = c.league;
            level = c.level;
            buildList();
        }
    }
    req.send();
}

function buildList() {
    if(rank){
        previousRank = rank.rank;
        rank = null;
    }
    let url = ladderUrl;
    if(eventName) url += "?id=" + eventName;
    else url += "?id=" + league;
    url += "&limit=1";
    
    let req = new XMLHttpRequest();
    req.open("GET",url);
    req.onloadend = () => {
        if(req.status != 200){
            window.setTimeout(buildList, 10000);
            return;
        }
        let d = JSON.parse(req.responseText);
        total = d.total;
        ladder = new Array(total);
        checkLowerBound();
    }
    req.send();
}

function checkLowerBound() {
    if(level == 0) {
        fetch(0);
        return;
    }
    let url = ladderUrl;
    if(eventName) url += "?id=" + eventName;
    else url += "?id=" + league;
    url += "&offset=" + (total - 1);
    url += "&limit=1";
    
    let req = new XMLHttpRequest();
    req.open("GET", url);
    req.onloadend = () => {
        if(req.status != 200){
            window.setTimeout(checkLowerBound, 10000);
            return;
        }
        let d = JSON.parse(req.responseText);
        if(d.entries[0].character.level > level){
            minLevel = d.entries[0].character.level;
            minEp = d.entries[0].character.experience;
            notFound();
            window.setTimeout(getCharacter, 10000);
        }
        else{
            fetch(0);
        }
    }
    req.send();
}

function fetch(offset){
    let limit = 200;
    if(!offset || offset < 0){
        offset = 0;
    }
    if (offset + limit > total){
        limit = total - offset;
    }
    let url = ladderUrl;
    if(eventName) url += "?id=" + eventName;
    else url += "?id=" + league;
    url += "&offset=" + offset;
    url += "&limit=" + limit;
    
    let req = new XMLHttpRequest();
    req.open("GET",url);
    req.onloadend = () => {
        if(req.status != 200){
            win.setTimeout(() => { fetch(offset) }, 10000);
            return;
        }
        let d = JSON.parse(req.responseText);
        offset += 200;
        for(let i = 0; i < d.entries.length; i++){
            ladder[d.entries[i].rank - 1] = d.entries[i];
            if(d.entries[i].character.name == characterName) {
                rank = d.entries[i];
            }
        }
        if(rank){
            found();
            window.setTimeout(getCharacter, 10000);
        }
        else if(offset > total){
            minLevel = d.entries[limit-1].character.level;
            minEp = d.entries[limit-1].character.experience;
            notFound();
            window.setTimeout(getCharacter, 10000);
        }
        else{
            window.setTimeout(() => { fetch(offset); }, 500);
        }
    }
    req.send();
}

function found(){
    elements.rank.innerText = "Rank: " + rank.rank;
    let delta;
    if(!previousRank) delta = 0;
    else delta = rank.rank - previousRank;
    elements.rankChange.innerText = delta >= 0 ? "+" + delta : delta;
    if(delta == 0) elements.rankChange.style.color = colors.same;
    else if(delta > 0) elements.rankChange.style.color = colors.up;
    else if(delta < 0) elements.rankChange.style.color = colors.down;
    
    let sameClass = ladder.filter((x) => x.character.class == rank.character.class && x.rank < rank.rank);
    let newClassRank = sameClass.length + 1;
    if(!classRank) delta = 0;
    else delta = newClassRank - classRank;
    elements.rankClassChange.innerText = delta >= 0 ? "+" + delta : delta;
    if(delta == 0) elements.rankClassChange.style.color = colors.same;
    else if(delta > 0) elements.rankClassChange.style.color = colors.up;
    else if(delta < 0) elements.rankClassChange.style.color = colors.down;
    classRank = newClassRank;
    elements.rankClass.innerText = rank.character.class + " Rank: " + classRank;
    
    elements.rank.style.display = "flex";
    elements.rankChange.style.display = "flex";
    elements.rankClass.style.display = "flex";
    elements.rankClassChange.style.display = "flex";
    elements.minLevel.style.display = "none";
    elements.minEp.style.display = "none";
    updateTime();
}

function notFound(){
    elements.rank.innerText = "Rank: < " + total;
    elements.rankChange.innerText = "+0";
    elements.rankChange.style.color = colors.same;
    elements.rankClass.innerText = "Unranked";
    elements.rankClassChange.innerText = "+0";
    elements.rankClassChange.style.color = colors.same;
    elements.minLevel.innerText = "Minimum Level: " + minLevel;
    elements.minEp.innerText = "Minimum EP: " + minEp;
    elements.updatedOn.innerText = (new Date()).getTime();

    elements.rank.style.display = "flex";
    elements.rankChange.style.display = "flex";
    elements.rankClass.style.display = "none";
    elements.rankClassChange.style.display = "none";
    elements.minLevel.style.display = "flex";
    elements.minEp.style.display = "flex";
    updateTime();
}

function updateTime() {
    let t = new Date();
    elements.updatedOn.innerText = "@" + pad(t.getHours(),2) + ":" + pad(t.getMinutes(),2) + ":" + pad(t.getSeconds(),2);
}

function pad(n,d){
    let l = n.toString();
    for(let i = n.toString().length; i < d; i++){
        l = '0' + l;
    }
    return l;
}

function hideInputs(){
    let labels = document.getElementsByClassName('label');
    for(let i = 0; i < labels.length; i++){
        document.getElementsByClassName('label').item(i).style.display = "none";
    }
    elements.account.style.display = "none";
    elements.name.style.display = "none";
    elements.event.style.display = "none";
    elements.season.style.display = "none";
}

ipcRenderer.on('elements', (e,d) => {
    seasons = d.seasons;
    events = d.events;
    
    elements.rank.innerText = d.rank.text
    elements.rankChange.innerText = d.rankChange.text
    elements.rankClass.innerText = d.rankClass.text
    elements.rankClassChange.innerText = d.rankClassChange.text
    elements.minLevel.innerText = d.minLevel.text
    elements.minEp.innerText = d.minEp.text
    elements.updatedOn.innerText = d.updatedOn.text
    
    elements.rank.style.display = d.rank.display;
    elements.rankChange.style.display = d.rankChange.display;
    elements.rankClass.style.display = d.rankClass.display;
    elements.rankClassChange.style.display = d.rankClassChange.display;
    elements.minLevel.style.display = d.minLevel.display;
    elements.minEp.style.display = d.minEp.display;
    elements.updatedOn.style.display = d.updatedOn.display;

    characterName = d.characterName;
    accountName = d.accountName;
    seasonName = d.seasonName;
    eventName = d.eventName;
    seasons = d.seasons;
    events = d.events;

    if(!d.frame){
        elements.updatedOn.style.display = "flex";
        if(elements.rank.innerText == "") elements.rank.innerText = "Fetching rank...";
        hideInputs();
        getCharacter();
        return;
    }
    
    document.getElementById('account').value = accountName;
    document.getElementById('name').value = characterName;
    displaySeasons();
    displayEvents();
    elements.season.value = seasonName;
    elements.event.value = eventName;
    elements.event.disabled = elements.season.value == "" ? true : false;
});