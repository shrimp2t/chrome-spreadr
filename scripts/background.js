'use strict';
console.log( 'Load_BG_Script' );
// chrome.devtools.network.onRequestFinished.addListener((request) => {
// 	request.getContent((body) => {
// 		if (request.request && request.request.url) {
// 			if (request.request.url.includes('semrush.com/pla/rpc')) {
// 				//continue with custom code
// 				var bodyObj = JSON.parse(body); //etc.
// 				console.log('details', bodyObj);
// 			}
// 		}
// 	});
// });

const requestInfo = {};

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
	if (req.action == 'pm_start_download') {
		requestInfo = {}; // restart.
		requestInfo['t_' + req.tabId] = {};
		console.log('pm_start_download Message recieved!');
	}
	sendResponse({ status: true });
});

chrome.webRequest.onBeforeRequest.addListener(
	async function(details) {
		// Use this to decode the body of your post.
		var postedString = decodeURIComponent(
			String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes))
		);

		let jsonData = JSON.parse(postedString);

		if (Array.isArray(jsonData)) {
			if (jsonData[0].method === 'pla.Copies') {
				if (typeof requestInfo['t_' + details.tabId] === 'undefined') {
					requestInfo['t_' + details.tabId] = {};
				}
				requestInfo['t_' + details.tabId]['r_' + details.requestId] = {
					data: jsonData,
					raw: postedString,
					status: 'loading'
				};
			}
		}
	},
	{ urls: [ 'https://*.semrush.com/pla/rpc' ] },
	[ 'blocking', 'requestBody' ]
);


// Check search done ?
chrome.webRequest.onCompleted.addListener(
	function(details) {
		chrome.tabs.sendMessage(
			details.tabId,
			{ 
				action: 'pm_seach_done'
			},
			function(response) {

			}
		);
	},
	{ urls: [ 'https://spreadr.co/searchamazonitems' ] },
	[ 'extraHeaders' ]
);


// Check import done ?
chrome.webRequest.onCompleted.addListener(
	function(details) {
		chrome.tabs.sendMessage(
			details.tabId,
			{ 
				action: 'pm_import_done'
			},
			function(response) {

			}
		);
	},
	{ urls: [ 'https://spreadr.co/addproductwithasin' ] },
	[ 'extraHeaders' ]
);


// When import done
// https://spreadr.co/addproductwithasin
