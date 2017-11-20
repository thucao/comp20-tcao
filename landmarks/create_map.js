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
var infowindow = new google.maps.InfoWindow();
var data;
var people;
var landmarks;
var closestLandmark;

// callback function when page loads
function init()
{
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	getMyLocation();
}

// Get my coordinates from navigator
function getMyLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			myLat = position.coords.latitude;
			myLng = position.coords.longitude;
			alert("Logged In: " + myLat + ", " + myLng);
			renderMap();
		});
	}
	else {
		alert("Geolocation is not supported by your web browser.  What a shame!");
	}
}

// Centers me on map
function renderMap()
{
	me = new google.maps.LatLng(myLat, myLng);
	map.panTo(me);
	getData();
}

// Gets data from herokuapp and posts my coords
function getData(){
	request.open("POST", "https://floating-river-70442.herokuapp.com/sendLocation", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.onreadystatechange = function() {//Call a function when the state changes.
		if(request.readyState == 4 && request.status == 200) {
			data = JSON.parse(request.responseText);
			people = data.people;
			landmarks = data.landmarks;
			createPeople();
			createLandmarks();
			renderPolyline();
			var closestDist = calcDistance(me, (new google.maps.LatLng(closestLandmark.geometry.coordinates[1] , closestLandmark.geometry.coordinates[0])));
			var title = "<b>Hello, it's me.</b><BR><BR><b>Closest Landmark: </b>" + closestLandmark.properties.Location_Name + "<BR><b>Distance: </b>" + closestDist + " miles";
			createMarker(me, "me.png", title);
		}
		else {
			createMarker(me, "me.png", "<b>Hello, it's me.</b><BR><BR><b>Closest Landmark: </b><BR><b>Distance</b>");
		}
	};
	request.send("login=7UfrTBZr&lat=" + myLat + "&lng=" + myLng);
}

// Crreates a polyline from me to closest landmark
function renderPolyline() {

	var path = [ {lat: me.lat() , lng: me.lng()},
          	     {lat: closestLandmark.geometry.coordinates[1] , lng: closestLandmark.geometry.coordinates[0]} ];

	var closestLand = new google.maps.Polyline({
  		path: path,
  		geodesic: true,
  		strokeColor: '#FF0000',
  		strokeOpacity: 1.0,
  		strokeWeight: 2
	});
	closestLand.setMap(map);
}

// Creates a new marker
function createMarker(loc, icon, title) {

	marker = new google.maps.Marker({
		position: loc,
		title: title,
		icon: icon
	});
	marker.setMap(map);

	// Open info window on click of marker
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.setContent(this.title);
		infowindow.open(map, this);
	});
}

// Create markers for people logged in onto herokuapp
function createPeople() {

	for (i = 0; i < people.length; i++) {
		var loc = new google.maps.LatLng(people[i].lat, people[i].lng);
		var login = people[i].login;
		var dist = calcDistance(me, loc);
		var title = "<b>Login: </b>" + login + "<BR><b>Distance: </b>" + dist + " miles";
		createMarker(loc, "person.png",title);
	}
}

// Create markers for all landmarks within one mile of me
function createLandmarks() {

	var smallDist = 1;
	for (i = 0; i < landmarks.length; i++) {
		var loc = new google.maps.LatLng(landmarks[i].geometry.coordinates[1],landmarks[i].geometry.coordinates[0]);
		var dist = calcDistance(me, loc);
		var title = landmarks[i].properties.Details;
		createMarker(loc, "landmark.png", title);
		if (dist < smallDist) {
			closestLandmark = landmarks[i];
			smallDist = dist;
		}
	}
}

// Returns the distance between two points in miles
function calcDistance(myLoc, otherLoc) {

	var dLat = (myLoc.lat() - otherLoc.lat()) * Math.PI / 180;
	var dLon = (myLoc.lng() - otherLoc.lng()) * Math.PI / 180;

	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(myLoc.lat() * Math.PI / 180) *
		Math.cos(otherLoc.lat() * Math.PI / 180) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);

	return (12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))/1.609344;
}
