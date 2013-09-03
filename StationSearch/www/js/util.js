// calc distance from - to
var calculateDistance = function (from, to) {
  var rad = function (n) {
    return n * Math.PI / 180;
  };
  var R = 6371; // km
  var dLat = rad(to.lat() - from.lat());
  var dLon = rad(to.lng() - from.lng());
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(from.lat())) * Math.cos(rad(to.lat())) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};

// soql escape
var soqlEscape = function (str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
};

// sosl escape
var soslEscape = function (str) {
  return str.replace(/([\\?&|!{}\[\]()^~*:"'+-])/g, '\\$1');
}
