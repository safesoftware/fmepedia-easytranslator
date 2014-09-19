window.onload = function() {

	resources.init({
		host : "https://fmepedia2014-safe-software.fmecloud.com",
		token : "fb1c3ee6828e6814c75512dd4770a02e73d913b8",
		basePath : "/FMEData2014/"
	});
	
};

var resources = (function() {
	//private
	var host, token, basePath;

	function showResults( json ) {
		// The following is to write out the full return object
		// for visualization of the example
		var hr = document.createElement( "hr" );
		var div = document.createElement( "div" );
		div.innerHTML = "<h4>Return Object:</h4><pre>"+JSON.stringify(json, undefined, 4)+"</pre>";
		document.body.appendChild( hr );
		document.body.appendChild( div );
	}

	function clearSelection(){
		var selected = document.getElementsByClassName('success');
		var selRow = selected[0];
		if (selRow != undefined){selRow.removeAttribute('class');}
	}

	function clickedFile(row){
		//get path to file on server
		clearSelection();
		row.className = 'success';
	}

	function clickedBreadCrumb(crumb){
		clearSelection();
		resources.getDetails(crumb.getAttribute('path'));
		var breadcrumbs = document.getElementById('breadcrumb');
		while (breadcrumbs.lastChild != crumb){
			breadcrumbs.removeChild(breadcrumbs.lastChild);
		}
	}

	function createBreadCrumb(path, name){
		var breadcrumbs = document.getElementById('breadcrumb');
		var newBC = document.createElement("li");
		newBC.setAttribute('path', path);
		newBC.innerHTML = '<a href="#">' + name + '</a><span class="divider">/</span>';
		newBC.onclick = function(){clickedBreadCrumb(this)};
		breadcrumbs.appendChild(newBC);
	}

	function clickedFolder(row){
		var curPath, name;
		clearSelection();
		if (row == null) {
			createBreadCrumb(basePath, 'Home');
			resources.getDetails(basePath);
		}
		else{
			curPath = row.getAttribute('path');
			var array = curPath.split('/');
			var name = array[array.length-1];
			var path = curPath.replace(/[^/]*$/, "");
			if (name != ""){
				createBreadCrumb(curPath, name);
			}
			resources.getDetails('/' + row.getAttribute('path'));
		}			
	}


	function displayFiles(json, element){
		//clear table
		var table = document.getElementById(element);
		table.innerHTML = '';

		for (var i = 0; i < json.contents.length; i++){
			var row = document.createElement('tr');
			var file = json.contents[i];
			if (file.type === 'FILE'){
				row.setAttribute('path', file.path + file.name);
				var fileName = document.createElement('td');
				fileName.innerHTML = '<span class="glyphicon icon-file"></span> ' + file.name;
				row.appendChild(fileName);
				var fileSize = document.createElement('td');
				fileSize.innerHTML = file.size + ' KB';
				row.appendChild(fileSize);
				var fileDate = document.createElement('td');
				fileDate.innerHTML = file.date;
				row.appendChild(fileDate);
				row.onclick = function(){clickedFile(this)};
			}
			else if (file.type === 'DIR'){
				row.setAttribute('path', file.path + file.name);
				var folderName = document.createElement('td');
				folderName.innerHTML = '<span class="glyphicon icon-folder-close"></span> ' + file.name;
				row.appendChild(folderName);
				var folderSize = document.createElement('td');
				folderSize.innerHTML = '-';
				row.appendChild(folderSize);
				var folderDate = document.createElement('td');
				folderDate.innerHTML = file.date;
				row.appendChild(folderDate);
				if (file.name.substr(file.name.length-4) == '.gdb'){
					row.onclick = function(){clickedFile(this)};
				}
				else{
					row.onclick = function(){clickedFolder(this)};
				}
			}
			table.appendChild(row);
		}

	}

	function showFiles( json ){
		displayFiles(json, 'tableBody');
	}

	function getResources() {
		// Ask FME Server for a list of shared resources
		FMEServer.getResources( showResults );
	}


	//public
	return {

		init : function(params) {
			var self = this;
            host = params.host;
            token = params.token;
            basePath = params.basePath;

			FMEServer.init ({
				server : host, 
				token : token
			});

			clickedFolder(null);
		},

		getDetails : function(path){
			var resource = 'FME_SHAREDRESOURCE_DATA';
			path = path || basePath;
			// Ask FME Server for a list of shared resources
			FMEServer.getResourceDetails( resource, path, showFiles );
		},

		returnSelected : function(){
			var selected = document.getElementsByClassName('success');
			var selRow = selected[0];
			if (selRow === undefined){
				return null;
			}
			else{
				var path = selRow.getAttribute('path');
				path = '"$(FME_SHAREDRESOURCE_DATA)' + path +'"';
				return path;
			}
		}

	};
}());

