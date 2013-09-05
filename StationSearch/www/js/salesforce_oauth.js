(function(w) {
  "use strict";

  var _oauth;
  var _instance;

  var SalesforceOAuth = function (apiVersion) {
    if (_instance) {
      return _instance;
    }
    _oauth = SalesforceOAuthPlugin;
    _instance = this;
    this.apiVersion = apiVersion || 'v28.0';
    return this;
  };

  SalesforceOAuth.init = function (apiVersion, success, error) {
    new SalesforceOAuth(apiVersion).init(success, error);
  };

  var _refresh = function (creds) {
    var credsData = creds;
    if (creds.data) credsData = creds.data;
    Force.init(credsData, this.apiVersion, null, _oauth.forcetkRefresh);
    this.success(credsData);
  };

  SalesforceOAuth.prototype.init = function (success, error) {
    this.success = success || function () {};
    _oauth.getAuthCredentials(_refresh.bind(this), error);
    document.addEventListener('salesforceSessionRefresh', _refresh.bind(this), false);
  };

  this.SalesforceOAuth = SalesforceOAuth;
}).call(this);
