var Promise = require('promise');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var version = '1.0.2';

var Audiosearch = function (oauthKey, oauthSecret, oauthHost) {
  var self = this;
  if (!oauthKey || !oauthSecret) {
    throw new Error('Audiosear.ch API requires key and secret to initialize.');
  }

  self._creds = {
    key: oauthKey,
    secret: oauthSecret,
    host: oauthHost || 'https://www.audiosear.ch',
  };

  self._ee = new EventEmitter();

  self._authorize().then(function (token) {
    self._token = token;
    self._ee.emit('authComplete');
  });
};

Audiosearch.prototype._authorize = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    var params = {'grant_type':'client_credentials'};
    var unencoded_sig = self._creds.key + ':' + self._creds.secret;
    var signature = new Buffer(unencoded_sig).toString('base64');
    var options = {
      url: self._creds.host + '/oauth/token',
      qs: params,
      headers: {
        'Authorization': 'Basic ' + signature,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    request.post(options, function (err, res, body) {
      if (res.statusCode !== 200) {
        console.warn(res);
        reject();
      }
      var token = JSON.parse(body).access_token;
      resolve(token);
    });
  });
};

Audiosearch.prototype.get = function (url, params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    var options = {
      url: self._creds.host + '/api' + url,
      qs: params,
      headers: {
        'Authorization': 'Bearer ' + self._token,
        'User-Agent': 'request'
      }
    };
    if (!self._token) {
      self._ee.once('authComplete', function () {
        return self.get(url, params).then(resolve);
      });
    } else {

      request(options, function (err, res, body) {
        if (err || res.statusCode !== 200) {
          return reject(err);
        }
        resolve(JSON.parse(body));
      });
    }
  });
};

Audiosearch.prototype.searchShows = function (queryString, params) {
  return this.get('/search/shows/'+encodeURI(queryString), params);
};

Audiosearch.prototype.searchEpisodes = function (queryString, params) {
  return this.get('/search/episodes/'+encodeURI(queryString), params);
};

Audiosearch.prototype.searchPeople = function (queryString, params) {
  return this.get('/search/people/'+encodeURI(queryString), params);
};

Audiosearch.prototype.getShow = function (showId) {
  return this.get('/shows/' + showId);
};

Audiosearch.prototype.getEpisode = function (episodeId) {
  return this.get('/episodes/' + episodeId);
};

Audiosearch.prototype.getTrending = function () {
  return this.get('/trending/');
};

Audiosearch.prototype.getRelated = function (id, _type) {
  var type = _type || 'episodes';
  return this.get('/'+type+'/'+id+'/related/');
};

Audiosearch.prototype.getTastemakers = function (_numResults) {
  var numResults = _numResults === undefined ? 5 : _numResults;
  return this.get('/tastemakers/episodes/' + numResults);
};

module.exports = Audiosearch;

// var Audiosearch = require('audiosearch-client-node');
// Application Id:
//
// f36d708e8b87230e853a193c94953251130c9f05808829e7abf484014cf61f09
//
// Secret:
//
// 8ca0622995fe6e1a0d2e5489cb6d4cfd32f37ab06b119c6f06f7a830656151f1

var audiosearch = new Audiosearch("f36d708e8b87230e853a193c94953251130c9f05808829e7abf484014cf61f09", "8ca0622995fe6e1a0d2e5489cb6d4cfd32f37ab06b119c6f06f7a830656151f1");

// audiosearch.getTastemakers().then(function (tastemakers) {
//   // do stuff here
// });
//
audiosearch.searchEpisodes('twit').then(function (results) {
  // do stuff here.
  console.log(results);
});
