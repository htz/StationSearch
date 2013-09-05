;(function ($) {
	var LOGIN_URL = "https://login.salesforce.com";

	$(function () {
		// get bootconfig.json
		$.getJSON('bootconfig.json', function (json) {
			SalesforceOAuthPlugin = new SalesforceOAuthChrome({
				login_url: LOGIN_URL,
				client_id: json.remoteAccessConsumerKey,
				redirect_uri: json.oauthRedirectURI,
				scopes: json.oauthScopes,
			});
			// get startPage
			$.get(json.startPage, function (html) {
				// get body
				var begin = html.indexOf('>', html.indexOf('<body')) + 1;
				var end = html.indexOf('</body>');
				var body = html.substr(begin, end - begin);
				$('body').html(body);
				// trigger deviceready event
				var e = document.createEvent('Events'); 
				e.initEvent("deviceready"); 
				document.dispatchEvent(e);
			});
		});
	})
}).call(this, jQuery);
