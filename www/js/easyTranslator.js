//Do this as soon as the DOM is ready
$(document).ready(function() {

	var fmes = new FMEServer({
		server : BuildForm.host,
		token : BuildForm.token
	});

	//Call server and get the session ID and path
	fmes.getSession(BuildForm.repository, BuildForm.workspaceName, function(json){
		BuildForm.session = json.serviceResponse.session;
		BuildForm.path = json.serviceResponse.files.folder[0].path;
		
		//Call server to get list of parameters and potential values
		fmes.getWorkspaceParameters(BuildForm.repository, BuildForm.workspaceName, BuildForm.buildParams);

		//Build up the form
		BuildForm.init();
	});
	
});

var BuildForm = {
	token : 'fb1c3ee6828e6814c75512dd4770a02e73d913b8',
	host : 'http://fmepedia2014-safe-software.fmecloud.com',
	repository : 'Samples',
	workspaceName : 'easyTranslator.fmw',
	session : null,
	path : null,

	init : function() {
		//prevent carousel from automatically moving
		$('#myCarousel').carousel('pause');

		//hide navigation buttons
		$('#back').hide();

		$('#dropText').hide();

		$('#back').click(function(){
			if (! $('#submissionPage').hasClass('active')){
				$('#back').hide();
				//clear the results page
				$('#resultStatus').remove();
				$('#loadingImage').show();
			}
		})

		//--------------------------------------------------------------
		//Initialize the drag and drop file upload area
		//--------------------------------------------------------------
		//control behaviour of the fileuploader
		$('#fileupload').fileupload({
			url : BuildForm.host + '/fmedataupload/' + BuildForm.repository + '/' +  BuildForm.workspaceName + ';jsessionid=' + BuildForm.session,
			dropzone : $('#dropzone'),
			autoUpload : true,

			//when a new file is added either through drag and drop or 
			//file selection dialog
			add : function(e, data){
				//displays filename and progress bar for any uploading files
				$('#fileTable').show();
				data.context = $('#fileTable');
				$.each(data.files, function(index, file) {
					if (!index) {
						var elemName = file.name;
						elemName = elemName.replace(/[.\(\)]/g,'');
						elemName = elemName.split(' ').join('');

						var row = $("<div id='row"+ elemName + "' class='fileRow'/>");

						var name = $("<div class='fileName'>" + file.name + '</div>');
						var progressBar = $("<div id='progress" + elemName + "' class='progress progress-success progress-striped' />");
						progressBar.append("<div class='bar' />");
						var progress = $("<div class='progressBar' id='" + elemName +"'/>").append(progressBar);
					}

					name.appendTo(row);
					progress.appendTo(row);
				 	row.appendTo(data.context);
				})

				data.submit();
			},

			done : function(e, data){
				//update list of uploaded files with button to select 
				//them as source datasets for translation
				var elemName = data.files[0].name;
				elemName = elemName.replace(/[.\(\)]/g, '');
				elemName = elemName.split(' ').join('');

				var test = 'stop';

				var button = $("<div class='fileBtn'/>");
				button.append("<button class='btn' onClick='BuildForm.toggleSelection(this)'>Select this File</button>");
				button.insertAfter('#' + elemName);
			}, 

			fail : function(e, data) {
				$.each(data.result.files, function(index, file) {
					var error = $('<span/>').text(file.error);
					$(data.context.children()[index])
						.append('<br>')
						.append(error);
				});
			},

	        dragover : function(e, data){
	      		//going to use this to change look of 'dropzone'
	      		//when someone drags a file onto the page
				var dropZone = $('#dropzone');
				var timeout = window.dropZoneTimeout;

				if (!timeout){
					dropZone.addClass('in');
				}
				else{
					clearTimeout(timeout);
				}

				var found = false;
				var node = e.target;
				do {
					if (node == dropZone[0]){
						found = true;
						break;
					}
					node = node.parentNode;
				}
				while (node != null);
				if (found){
					$('#dropText').show();
					dropZone.addClass('hover');
				}
				else {
					$('#dropText').hide();
					dropZone.removeClass('hover');
				}
				window.dropZoneTimeout = setTimeout(function(){
					window.dropZoneTimeout = null;
					$('#dropText').hide();
					dropZone.removeClass('in hover');
				}, 100);
			},

			//give updates on upload progress of each file
			progress : function(e, data){
				var progress = parseInt(data.loaded / data.total * 100, 10);

				var name = data.files[0].name
				name = name.replace(/[.\(\)]/g, '');
				name = name.split(' ').join('');

				var progressId = '#progress' + name + ' .bar';
				$(progressId).css('width', progress + '%');

			}
		});
	},

	submit : function() {
		var files = '"'; 
		var fileList = $('.fileRow');

		//check a file has been uploaded and at least one is selected
		if (fileList.length == 0){
			//put out an alert and don't continue with submission
			$('#dropzone').prepend('<div class="alert alert-error"> Please upload a file. <button type="button" class="close" data-dismiss="alert">&times;</button></div>');
		}

		else{
			var fileSelected = false;
			for(var y=0; y<fileList.length;y++){
				if (fileList[y].lastChild.textContent == 'Selected'){
					fileSelected = true;
					break;
				}
			}
			if(fileSelected == false){
				//put out alert and don't continue with submission
				$('#dropzone').prepend('<div class="alert alert-error"> Please select a file for transformation.<button type="button" class="close" data-dismiss="alert">&times;</button></div>');
			}
			else{
				//advance to submission screen
				$('#myCarousel').carousel('next');

				for (var i = 0; i < fileList.length; i++){
					if (fileList[i].lastChild.textContent == 'Selected'){
						files = files + '"' + BuildForm.path + '/' + fileList[i].firstChild.textContent + '" ';
					}
				}

				files = files + '"';

				//get parameter values
				var sourceFormat = $('#SourceFormat')[0].value;	
				var destFormat = $('#DestinationFormat')[0].value;
				var outputCoordSys = $('#COORDSYS_Dest')[0].value;

				//build url
				var submitUrl = BuildForm.host + '/fmedatadownload/' + BuildForm.repository + '/' +  BuildForm.workspaceName + '?SourceDataset_GENERIC=' + files;
				submitUrl = submitUrl + '&SourceFormat=' + sourceFormat;
				submitUrl = submitUrl + '&DestinationFormat=' + destFormat;
				submitUrl = submitUrl + '&COORDSYS_Dest=' + outputCoordSys + '&opt_responseformat=json';

				//submit
				$.getJSON(submitUrl)
					.done(function(result){					
						 BuildForm.displayResults(result, true);
					})
					.fail(function(textStatus){
						//deal with different types of errors
						//always make sure to hide the loading image and display the back button.
						//maybe build up error message and then put that into resultStatus in displayResults
						//error code: textStatus.status
						//error text: textStatus.statusText
						//FME Error: textStatus.responseJSON.serviceResponse.fmeTransformationResult.fmeEngineResponse.statusMessage
						var error = textStatus;		
						BuildForm.displayResults(error, false);
					});
			}
		}
	},

	displayResults : function(result, isSuccess){
		//hide loading image
		$('#loadingImage').hide();

		//show back button
		$('#back').show();

		//get the JSON response from the Server and displays information on the page
		var resultStatus = $('<div id="resultStatus" />');

		if (isSuccess){
			resultStatus.append("<h3>Your data has successfully been translated!</h3>");
			resultStatus.append("<br />");
			var resultLink = $('<div id="resultLink" />');

			var link = '<a href="' + result.serviceResponse.url + '">' +"Download Results" + '</a>';
			resultLink.append(link);

			resultStatus.append(resultLink);
		}
		else{
			var FMEError = result.responseJSON.serviceResponse.fmeTransformationResult.fmeEngineResponse.statusMessage;
			resultStatus.append("<h3>There was an error submitting your request</h3>");
			resultStatus.append('<br/>');
			resultStatus.append('<p class="errorMsg">Error ' + result.status + ': ' + result.statusText + '</p>');
			if (FMEError == "Translation Successful"){
				resultStatus.append('<p class="errorMsg">No features were read from the source dataset</p>');
			}
			else{
				resultStatus.append('<p class="errorMsg" >' + FMEError + '</p>');
			}
			resultStatus.append('<br/>');
			resultStatus.append('<p class="errorNote">Use the back arrow to return to the start page.</p>');
		}

		$('#results').append(resultStatus);
	},

	buildParams : function(json){
		//parse JSON response
		//add in drop down menu options from workspace
		var paramArray = json;
		var elements = [ 'SourceFormat', 'DestinationFormat' ];
		for (var i = 0; i < paramArray.length; i++){
			//populate drop-down options for choice-type parameters
			if (elements.indexOf(paramArray[i].name) != -1){
				//populate drop-down options on page
				if(paramArray[i].listOptions){
					var optionArray = paramArray[i].listOptions;
					for (var x = 0; x < optionArray.length; x++){
						if (optionArray[x].value != 'SDF3' && optionArray[x].value != 'SQLITE3FDO'){
							var option = $('<option />', {value: optionArray[x].value, text: optionArray[x].caption});
							$('#' + paramArray[i].name).append(option);
						}
					}
				}
			}
		}
	},

	toggleSelection : function(e){
		var test = e;
		var blah = '';

		if (e.textContent == 'Select this File'){
			e.textContent = 'Selected';
			e.className = 'btn btn-success';
		}
		else {
			e.textContent = 'Select this File';
			e.className = 'btn';
		}
	}

}
