;(function ($) {
	"use strict";
	// OAuthChrome object
	var OAuthChrome = function (options) {
		var self = this;
		self.info = {
			access_token: options.access_token,
			refresh_token: options.refresh_token,
		};
		self.authorize_url = options.authorize_url;
		self.token_url = options.token_url;
		self.client_id = options.client_id;
		self.client_secret = options.client_secret;
		self.redirect_uri = options.redirect_uri;
		self.response_type = options.response_type || "token";
		self.scopes = options.scopes || [];
	};

	OAuthChrome.prototype.hasToken = function () {
		var self = this;
		if (!self.info.access_token || self.info.access_token === "") return false;
		return true;
	};

	var _authorizeUrl = function () {
		var self = this;
		var url = $.url(self.authorize_url);
		var params = _.extend({
			"response_type": self.response_type,
			"client_id": self.client_id,
			"redirect_uri": self.redirect_uri,
			"scope": self.scopes.join(" ")
		}, url.param());

		return url.attr("protocol") + "://" +
			url.attr("host") + url.attr("path") +
			"?" + $.param(params);
	};

	var _parseParameters = function (url, separator) {
		var separator = separator || "?";
		var res = {};
		var url = $.url(url);

		if (separator === "?") {
			var nvps = url.attr("query").split("&");
		} else if (separator === "#") {
			var nvps = url.attr("fragment").split("&");
		} else {
			var nvps = {};
		}
		for (var nvp in nvps) {
			var parts = nvps[nvp].split("=");
			res[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
		}
		return res;
	};

	// authorize token
	OAuthChrome.prototype.authorize = function (options) {
		var self = this;
		options.error = options.error || function() {};
		chrome.tabs.create(
			{url: _authorizeUrl.call(self)},
			function () {
				var updateListener = function (tabId, info, tab) {
					var startsWith = function (str1, str2) {
						return str1.substr(0, str2.length) === str2;
					};
					if (info.status === "loading" && startsWith(tab.url, self.redirect_uri)) {
						console.log("OAuth done.");
						chrome.tabs.onUpdated.removeListener(updateListener);
						chrome.tabs.remove(tabId);
						if (self.response_type === "token") {
							var res = _parseParameters.call(self, tab.url, "#");
							if (res.access_token) {
								self.info = res;
								options.success(res);
							} else {
								options.error();
							}
						} else if (self.response_type === "code" && self.token_url) {
							var res = _parseParameters.call(self, tab.url, "?");
							if (res.code) {
								_accessToken.call(self, res.code, function(request, textStatus) {
									if (request.status === 200) {
										var res = JSON.parse(request.responseText);
										self.info = res;
										options.success(res);
									} else {
										options.error();
									}
								});
							} else {
								options.error();
							}
						} else {
							options.error();
						}
					}
				};
				chrome.tabs.onUpdated.addListener(updateListener);
			}
		);
	};

	var _accessToken = function (code, callback) {
		var self = this;
		$.ajax({
			type: "POST",
			url: self.token_url,
			data: {
				state: "",
				code: code,
				client_id: self.client_id,
				client_secret: self.client_secret,
				redirect_uri: self.redirect_uri,
				grant_type: "authorization_code"
			},
			dataType: "json",
			timeout: 5000,
			complete: callback
		});
	};

	OAuthChrome.prototype.refreshToken = function (options) {
		var self = this;
		$.ajax({
			type: "POST",
			url: self.token_url,
			data: {
				state: "",
				client_id: self.client_id,
				refresh_token: self.info.refresh_token,
				grant_type: "refresh_token"
			},
			dataType: "json",
			timeout: 5000,
			complete: function(response, textStatus) {
				if (response.status === 200) {
					var res = JSON.parse(response.responseText);
					self.info = _.extend(self.info, res);
					options.success(self.info);
				} else if (options.error) {
					options.error();
				}
			}
		});
	};

	OAuthChrome.prototype.setAccessToken = function (access_token) {
		var self = this;
		self.info.access_token = access_token;
	};

	OAuthChrome.prototype.setRefreshToken = function (refresh_token) {
		var self = this;
		self.info.refresh_token = refresh_token;
	};

	this.OAuthChrome = OAuthChrome;
}).call(this, jQuery);
