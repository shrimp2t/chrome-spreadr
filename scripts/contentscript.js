"use strict";

function convertToCSV(objArray) {
    var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
    var str = "";

    for (var i = 0; i < array.length; i++) {
        var line = "";
        for (var index in array[i]) {
            if (line != "") line += ",";

            line += array[i][index];
        }

        str += line + "\r\n";
    }

    return str;
}

function exportCSVFile(items, fileTitle) {
    // Convert Object to JSON
    //var jsonObject = JSON.stringify(items);
    var csv = jQuery.csv.fromObjects(items);

    var exportedFilenmae = fileTitle + ".csv" || "export.csv";

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) {
            // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilenmae);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}


chrome.extension.onMessage.addListener(async function(
    req,
    sender,
    sendResponse
) {
	// pm_import_done
	switch( req.action ) {
		case 'pm_seach_done':
			sendResponse({ status: true });
			jQuery( document ).trigger( 'pm_seach_done' );
			// console.log( 'Search Done' );
			// await sleep(600);
			// doImport();
			break;
		case 'pm_import_done':
			sendResponse({ status: true });
			jQuery( document ).trigger( 'pm_import_done' );
			// console.log( 'Import Done' );
			// doneImport();
			break;
	}
});

// -----------------------------

let pm_delay = 2000; // 2 seconds
let pm_saveData = [];
let pm_fileName = "";
let pm_working_sku = '';
let pm_list = [];
let pm_countList = 0;
let pm_indexing = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function checkList( status ) {
	pm_saveData.push( { sku: pm_working_sku, status } );
}

function doImport(){
	var $rows =  jQuery( '#searchresults #itemlist .row' );
	if ( ! $rows.length ) {
		console.log( 'No results' );
		checkList( 'not_found' );
		jQuery( document ).trigger( 'pm_row_done' );
		return;
	}
	var $row = $rows.eq(0);
	var warningP = $row.find( 'p.text-danger' );
	if ( warningP.length && ! warningP.hasClass( 'hide' ) ) {
		checkList( 'already_imported' );
		console.log( 'Already imported' );
		jQuery( document ).trigger( 'pm_row_done' );
		return;
	}
	$row.find( 'button.btn-primary' ).click();
}

function doneImport(){
	checkList( 'ok' );
	jQuery( document ).trigger( 'pm_row_done' );
}


jQuery(document).ready(function($) {	

	if ( window.location != 'https://spreadr.co/search' ) {
		return ;
	}

    let $button = $("<button id='pm-toggle-input' style='font-size: 12px; font-weight: bold; line-height: 1; position: fixed; z-index: 999999; right: 20px; bottom: 20px; border: 1px solid rgb(30, 136, 229); border-radius: 5px; padding: 5px 10px; background: #00acc1; color: rgb(255, 255, 255);'>Auto Import</button>");
	let $html = '<div id="pm-input-wrapper" style="background: #eceff1; border-radius: 3px; display: none; position: fixed; top: 30px; bottom: 50px; right: 20px; z-index: 9999; width: 250px; padding: 10px; border: 1px solid #ccc;">\
		<textarea id="pm-skus" placeholder="Enter SKUs here, each item per line." style="font-size: 12px; width: 100%; height: calc( 100% - 35px ); margin-bottom: 5px; display: block; padding: 10px; border: 1px solid #ccc;" rows="10"></textarea>\
		<button style="background: #2196f3; font-size: 12px; padding: 5px 10px; line-height: 1; color: #fff; border: 0px none; border-radius: 3px;" type="button" id="pm-run">Run</button>\
		<button style="display: none; background: #ef5350; font-size: 12px; padding: 5px 10px; line-height: 1; color: #fff; border: 0px none; border-radius: 3px;" type="button" id="pm-download">Download Report</button>\
		</div>';
    
	$( 'body' ).append( $button );
	$( 'body' ).append( $html );
	// $button.on( 'click', function( e ) {
	// 	e.preventDefault();
	// } );


	function action(){
		console.log( 'indexing', pm_indexing );
		var sku = pm_list[ pm_indexing ];
		pm_working_sku = sku.trim();
		var $inputKeywords = $( 'input#keywords' );
		var $submitButton = $( '#searchbutton' );
		$inputKeywords.val( sku );
		$submitButton.click();
	}


	$( document ).on( 'pm_seach_done', async function(){
		// console.log( 'Search Done' );
		await sleep(1000);
		doImport();
	} );

	$( document ).on( 'pm_import_done', function(){
		// console.log( 'Import Done' );
		doneImport();
	} );

	$( document ).on( 'pm_row_done', async function(){
		pm_indexing ++;
		if ( pm_indexing >= pm_countList ) {
			jQuery( document ).trigger( 'pm_all_done' );
		} else {
			await sleep(pm_delay);
			$( '#pm-run' ).text( `Running...(${pm_indexing+1}/${pm_countList})` );
			action();
		}
	} );

	$( document ).on( 'pm_all_done', function(){
		// console.log( 'All done', pm_saveData );
		$( '#pm-download' ).css( 'display', 'inline-block' );
		$( '#pm-run' ).css( 'display', 'inline-block' ).text( 'Run' ).removeAttr( 'disabled' );
	} );

	$( document ).on( 'pm_start_check', function(){
		pm_saveData = [];
		pm_indexing = 0;
		$( '#pm-download' ).css( 'display', 'none' );
		$( '#pm-run' ).css( 'display', 'inline-block' ).attr( 'disabled', 'disabled' ).text( `Running...(1/${pm_countList})` );
		if ( pm_indexing >= pm_countList ) {
			jQuery( document ).trigger( 'pm_all_done' );
		} else {
			action();
		}
	} );

	$( '#pm-run' ).on( 'click', function( e ) {
		e.preventDefault();

		if ( ! $( this ).is( ':disabled' ) ) {
			var string_sku = $( '#pm-skus' ).val() || '';
			string_sku = string_sku.trim( string_sku );
			if ( ! string_sku ) {
				return;
			}
			pm_list = string_sku.split(/\r?\n/);
			pm_countList = pm_list.length;
			console.log( 'countList', pm_countList );
			console.log( 'list', pm_list );
			jQuery( document ).trigger( 'pm_start_check' );
		}
		
		
	} );

	$( document ).on( 'click', '#pm-download', function(e){
		exportCSVFile( pm_saveData, 'spreadr-report-' + (new Date().getTime()) );
	} );

	$( document ).on( 'click', '#pm-toggle-input', function(e){
		$( '#pm-input-wrapper' ).toggle();
	} );

});
