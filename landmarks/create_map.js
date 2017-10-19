var myLat = 0;
var myLng = 0;
var request = new XMLHttpRequest();
var me = new google.maps.LatLng(myLat, myLng);
var myOptions = {
	zoom: 13, // The larger the zoom number, the bigger the zoom
	center: me,
	mapTypeId: google.maps.MapTypeId.ROADMAP
};
var map;
var meMarker;
var landMarkers = {};
var peopleMarkers = {};
var infowindow = new google.maps.InfoWindow();
var data;
var people;
var landmarks;
var closestLandmark = {loc: me, name: "", dist: 0};

function init()
{
	if (navigator.geolocation) { // the navigator.geolocation object is supported on your browser
		navigator.geolocation.getCurrentPosition(function(position) {
			myLat = position.coords.latitude;
			myLng = position.coords.longitude;
		});
	}
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	getMyLocation();
}

function getMyLocation() {
	if (navigator.geolocation) { // the navigator.geolocation object is supported on your browser
		navigator.geolocation.getCurrentPosition(function(position) {
			myLat = position.coords.latitude;
			myLng = position.coords.longitude;
			renderMap();
		});
	}
	else {
		alert("Geolocation is not supported by your web browser.  What a shame!");
	}
}

function renderMap()
{
	me = new google.maps.LatLng(myLat, myLng);
	// Update map and go there...
	map.panTo(me);
	// Create a marker
	getData();

	var title = "<b>Hello, it's me.</b><BR><BR><b>Closest Landmark: </b>" + closestLandmark.name + "<BR><b>Distance: </b>" + closestLandmark.dist + " miles";

	createMarker(meMarker, me, "me.png", title);
	renderPolyline(me, closestLandmark.loc);

}

function renderPolyline(me, loc) {
	// var loc = new google.maps.LatLng(landmark.geometry.coordinates[1], landmark.geometry.coordinates[0]);
console.log(loc.lat());
console.log(loc.lng());
	var path = [ {lat: me.lat() , lng: me.lng()},
          	     {lat: loc.lat(), lng: loc.lng()} ];

	var closestLand = new google.maps.Polyline({
  		path: path,
  		geodesic: true,
  		strokeColor: '#FF0000',
  		strokeOpacity: 1.0,
  		strokeWeight: 2
	});

	closestLand.setMap(map);
}

function createMarker(marker, loc, icon, title) {
	marker = new google.maps.Marker({
		position: loc,
		title: title,
		icon: icon
	});
	marker.setMap(map);

	// Open info window on click of marker
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.setContent(marker.title);
		infowindow.open(map, marker);
	});

}

function getData(){
	request.open("POST", "https://defense-in-derpth.herokuapp.com/sendLocation", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.onreadystatechange = function() {//Call a function when the state changes.
		if(request.readyState == 4 && request.status == 200) {
			data = JSON.parse(request.responseText);
			people = data.people;
			landmarks = data.landmarks;
			createPeople();
			createLandmarks();
		}
	};
	request.send("login=7UfrTBZr&lat=" + myLat + "&lng=" + myLng);
}

function createPeople() {
	for (i = 0; i < people.length; i++) {
		var loc = new google.maps.LatLng(people[i].lat, people[i].lng);
		var login = people[i].login;
		var dist = calcDistance(me, loc); // TODO : calc distance from me to this person
		var title = "<b>Login: </b>" + login + "<BR><b>Distance: </b>" + dist + " miles";
		createMarker(peopleMarkers[i], loc, "person.png",title);
	}
}

function createLandmarks() {
	var l = 0;
	var smallDist = 1;
	var dist = 0;
	var loc = new google.maps.LatLng(0,0);
	for (i = 0; i < landmarks.length; i++) {
		// TODO : calc distance within 1 mile first before making marker
		loc = new google.maps.LatLng(landmarks[i].geometry.coordinates[1],landmarks[i].geometry.coordinates[0]);
		dist = calcDistance(me, loc); // TODO : calc distance from me to this person
		if (dist <= 1) {
			var title = landmarks[l].properties.Details;
			createMarker(landMarkers[l], loc, "landmark.png",title);
			l++;
			if (dist < smallDist) {
				console.log(title);
				closestLandmark.loc = loc;
				closestLandmark.name = landmarks[l].properties.Location_Name;
				closestLandmark.dist = dist;
				smallDist = dist;
			}
		}
	}
}

function toRad(x) {
    	return x * Math.PI / 180;
}

// Returns the distance between two points in miles
function calcDistance(myLoc, otherLoc) {


	var dLat = toRad(myLoc.lat() - otherLoc.lat());
	var dLon = toRad(myLoc.lng() - otherLoc.lng());

	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(myLoc.lat())) *
		Math.cos(toRad(otherLoc.lat())) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);

	//return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return (12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))/1.609344;
}
