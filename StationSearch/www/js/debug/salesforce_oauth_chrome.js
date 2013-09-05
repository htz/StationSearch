;(function ($, OAuthChrome) {
	"use strict";
	// SalesforceOAuthChrome object
	var SalesforceOAuthChrome = function (options) {
		var self = this;
		self.login_url = options.login_url;
		self.token_url = options.token_url;
		self.client_id = options.client_id;
		self.redirect_uri = options.redirect_uri;
		self.scopes = options.scopes;
		self.display = options.display || "popup"; // page | popup | touch | mobile

		self.info = {
			loginUrl: self.login_url,
			clientId: self.client_id,
			accessToken: options.accessToken,
			refreshToken: options.refreshToken,
		};
		if (localStorage[LOCAL_STRAGE_KEY]) {
			self.info = _.extend(self.info, JSON.parse(localStorage[LOCAL_STRAGE_KEY]));
		}
		self.oauth = new OAuthChrome({
			authorize_url: self.login_url + "/services/oauth2/authorize?display=" + self.display,
			token_url: self.login_url + '/services/oauth2/token',
			client_id: self.client_id,
			redirect_uri: self.redirect_uri,
			response_type: "token",
			access_token: self.info.accessToken,
			refresh_token: self.info.refreshToken,
			scopes: self.scopes,
		});
	};

	var LOCAL_STRAGE_KEY = "chrome.session.info";

	// get auth credentials
	SalesforceOAuthChrome.prototype.getAuthCredentials = function (success, error) {
		var self = this;
		if (self.info.refreshToken) {
			self.refreshToken(success, error);
		} else {
			self.authorize({
				success: success,
				error: error,
			});
		}
	};

	// authorize token
	SalesforceOAuthChrome.prototype.authorize = function (options) {
		var self = this;
		self.oauth.authorize({
			success: function (res) {
				self.info = _.extend(self.info, {
					accessToken: res.access_token,
					instanceUrl: res.instance_url,
					refreshToken: res.refresh_token,
					id: res.id,
					scopes: res.scope.split(" "),
				});
				localStorage[LOCAL_STRAGE_KEY] = JSON.stringify(self.info);
				options.success(self.info);
			},
			error: options.error
		});
	};

	// refresh token
	SalesforceOAuthChrome.prototype.refreshToken = function (success, error) {
		var self = this;
		self.oauth.refreshToken({
			success: function (res) {
				self.info = _.extend(self.info, {
					accessToken: res.access_token,
					instanceUrl: res.instance_url,
					refreshToken: res.refresh_token,
					id: res.id,
					scopes: res.scope.split(" "),
				});
				localStorage[LOCAL_STRAGE_KEY] = JSON.stringify(self.info);
				success(self.info);
			},
			error: error
		});
	};

	SalesforceOAuthChrome.prototype.setSessionToken = function (sessionId, refreshToken) {
		var self = this;
		self.info.accessToken = sessionId;
		self.oauth.setAccessToken(sessionId);
		self.info.refreshToken = refreshToken;
		self.oauth.setRefreshToken(refreshToken);
	};

	SalesforceOAuthChrome.prototype.logout = function (options) {
		var self = this;
		options = options || {};
		var url = self.info.instanceUrl + "/services/oauth2/revoke";
		$.ajax({
			type: "POST",
			url: url,
			contentType: "application/x-www-form-urlencoded",
			cache: false,
			processData: false,
			data: "token=" + self.info.accessToken,
			success: function (res) {
				if (options.success) options.success(res);
			},
			error: options.error || function () {},
		});
		localStorage.removeItem(LOCAL_STRAGE_KEY);
	};

	this.SalesforceOAuthChrome = SalesforceOAuthChrome;
}).call(this, jQuery, OAuthChrome);
