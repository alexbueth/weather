var w = {
	
	/*** initial values ***/
	showDebugInforamtion: false, // if true, debug information is displayed on the console
	api: 'http://acs.acentic.com/CloudServices/rest/', //url to API
	config: '/weather/resources/weather.config.json',
	startID: 'GMXX0018', //begins with Cologne 
	currentIndex: null, 
	cityHeight: 49,

	json: {},
	el: {},
	
	/*** script starts here by loading the menu content and config file ***/
	init: function(){
		w.background = document.getElementById('background');
		w.getJSON(w.api+'weatherlocations', function(res){
			w.debug({txt:'JSON: process data'});
			w.debug(res);
			w.locations = res.location;
			w.getJSON(w.config, function(res){				
				w.debug({txt:'JSON: process config'});
				w.debug(res);
				w.config = res;
				w.generateCityMenu();
			});
		});
	},
	
	/*** generate navigation from the main JSON ***/
	generateCityMenu: function(){
		var i, x;
		
		w.el.menuWrapper = w.createElement({id:'menuWrapper'});
		w.el.openWrapper = w.createElement({id:'openWrapper'});
		w.el.buttonPrev  = w.createElement({parentElement:w.el.menuWrapper,id:'buttonPrev',content:'&laquo;',class:'button',type:'A'});
		w.el.cities      = w.createElement({parentElement:w.el.menuWrapper,id:'cities'});
		w.el.buttonNext  = w.createElement({parentElement:w.el.menuWrapper,id:'buttonNext',content:'&raquo;',class:'button',type:'A'});
		
		for(i=0; i<w.locations.length; i++){
			if(w.locations[i].code===w.startID){ w.currentIndex = i; }
			x = w.createElement({parentElement:w.el.cities,class:'city'});
			w.createElement({parentElement:x, class: 'country',content:w.locations[i].country});
			w.createElement({parentElement:x, class: 'name',content:w.locations[i].name});

			x = w.createElement({parentElement:w.el.openWrapper,class:'choose',type:'a',info:i});
			w.createElement({parentElement:x, class: 'country',content:w.locations[i].country});
			w.createElement({parentElement:x, class: 'name',content:w.locations[i].name});
			x.addEventListener("click", w.chooseCity);
		}
		w.move();
		w.el.buttonPrev.addEventListener("click", w.prev);
		w.el.buttonNext.addEventListener("click", w.next);
		w.el.cities.addEventListener("click", w.open);
			
		document.onkeydown = w.checkKey;
	},
	
	/*** opens drop down menu ***/
	open: function(){
		if(w.el.openWrapper.style.display === 'block'){
			w.close();
			return;
		}
		w.el.openWrapper.style.display = 'block';
		w.el.openWrapper.scrollTop = (w.currentIndex * w.cityHeight) + w.currentIndex;
		w.el.openWrapper.classList.remove('hideMenu');
		w.el.openWrapper.classList.add('showMenu');
	},
	
	/*** closes drop down menu ***/
	close: function(){
		w.el.openWrapper.classList.remove('showMenu');
		w.el.openWrapper.classList.add('hideMenu');
		window.setTimeout(function(){ w.el.openWrapper.style.display = 'none'; }, 200);
	},
	
	/*** sets currentIndex to selected value ***/
	chooseCity: function(e){
		var el, ind;
		e = e || window.event;	
		switch(e.target.className){
			case 'country': case 'name': el = e.target.parentNode; break;
			default:el = e.target;
		}	
	    w.currentIndex = parseInt(el.getAttribute('info'),10);
	    w.move();
	},
	
	/*** sets currentIndex to previous value ***/
	prev: function(){
		w.currentIndex = (w.currentIndex === 0) ? (w.locations.length -1) : (w.currentIndex - 1)
		w.move();
		return false;
	},

	/*** sets currentIndex to next value ***/
	next: function(){
		w.currentIndex = (w.currentIndex === (w.locations.length -1)) ? 0 : (w.currentIndex + 1)
		w.move();
		return false;
	},
	
	/*** moves navigation to correct endpoint and initiates loading sub JSON from server ***/
	move: function(){
		w.close();
		var i, preScreen = document.getElementsByClassName('city-screen');
		if(preScreen.length > 0 ){
			for(i=0; i<preScreen.length; i++){
				preScreen[i].parentNode.removeChild(preScreen[i]);
			}
		}
		w.el.cities.style.top = (w.currentIndex * w.cityHeight * -1) + 'px';
		w.background.style.display = 'none';
		imageSearch = new google.search.ImageSearch();
		imageSearch.setSearchCompleteCallback(this, w.imageSearchComplete, null);
		imageSearch.execute(w.locations[w.currentIndex].country + " " + w.locations[w.currentIndex].name);
		google.search.Search.getBranding('branding');
		w.getJSON(w.api+'weather/'+w.locations[w.currentIndex].code, function(res){
			w.displayCityData(res);
		});
	},
	
	/*** google images search for background has found an image ***/
	imageSearchComplete: function () {
		var i, preload, currentResolution, highestResolution = 0, hiresIndex = 0;
		if (imageSearch.results && imageSearch.results.length > 0) {
			for(i=0; i<imageSearch.results.length; i++){
				currentResolution = parseInt(imageSearch.results[i].height,10) * parseInt(imageSearch.results[i].width,10);
				if(currentResolution > highestResolution){
					highestResolution = currentResolution;
					hiresIndex = i;
				}
			}
			preload = new Image();
			preload.src = imageSearch.results[hiresIndex].url;
			preload.onload = function(){
				w.background.style.backgroundImage = 'url(' + this.src + ')';
				if(navigator.userAgent.indexOf("Safari") > -1){
					window.setTimeout(function(){
						w.background.style.display = 'block';	
						w.background.classList.add('fadein3');
					},1000);
				} else{
					w.background.style.display = 'block';	
					w.background.classList.add('fadein3');
				}
			}
		}
	},
      
	/*** creation of city screen ***/
	displayCityData: function(data){
		w.debug(data);
		if(w.config.elements && w.config.elements.length > 0){
			w.createCityElementRecurse(null, w.config.elements, data);
		}
		
		document.getElementById(data.locationId).classList.add('fadein');
		var i, preScreen = document.getElementsByClassName('city-screen');
		if(preScreen.length > 0 ){
			for(i=0; i<(preScreen.length-1); i++){
				preScreen[i].parentNode.removeChild(preScreen[i]);
			}
		}
	},

	/*** creates elements as long as sub elements can be found in config file ***/
	createCityElementRecurse: function(parentElement, elements, data){
		var i, newParent, selectedData;
		for(i=0; i<elements.length; i++){
			selectedData = w.getData(elements[i].data,data);
			newParent = w.createElement({ 
				parentElement: parentElement,
				class: elements[i].class, 
				type: elements[i].type, 
				id: w.replaceData(elements[i].id, selectedData),
				content:w.replaceData(elements[i].content, selectedData),
				src: (elements[i].src != null) ? w.replaceData(elements[i].src, selectedData) : null
			});	
			if(elements[i].elements && elements[i].elements.length > 0){
				w.createCityElementRecurse(newParent,elements[i].elements, data);
			}
		}
	},
	
	/*** selects data array for selector ***/
	getData: function(selector, data){
		var nodata = {day: "&nbsp;", date: "no data available", low: "-", high: "-", code: "na"};
		switch(selector){
			case 'data': return data;
			case 'data.forecast[0]': return data.forecast[0] ? data.forecast[0] : nodata; break;
			case 'data.forecast[1]': return data.forecast[1] ? data.forecast[1] : nodata; break;
			case 'data.forecast[2]': return data.forecast[2] ? data.forecast[2] : nodata; break;
			case 'data.forecast[3]': return data.forecast[3] ? data.forecast[3] : nodata; break;
			case 'data.forecast[4]': return data.forecast[4] ? data.forecast[4] : nodata; break;
			default: return null
		}
	},
	
	/*** finds placeholders and replaces them with information  ***/
	replaceData: function(str, data){
		if(str!=undefined){
			for(var x in data){
				if(str.indexOf('{'+x+'}') != -1){
					str = str.replace('{'+x+'}',data[x]);
				}
			}
		}
		return str;
	},
	
	/*** reacts to keyboard actions ***/
	checkKey: function(e) {
	    e = e || window.event;		
	    w.debug({keyCode:e.keyCode});
		switch(e.keyCode){
			case 37: case 38: w.prev(); break;
			case 39: case 40: w.next(); break;			
		}
	},

	/*** creates an HTML element by given data ***/
	createElement: function(attr){
		//attr = {parentElement:null,id:null,class:null,style:null,type:null,content:null};

		w.elementCount = (w.elementCount==null) ? 0 : w.elementCount +1;
		attr.parentElement = (attr.parentElement==null) ? document.body : attr.parentElement;
		attr.type = (attr.type == null) ? 'DIV' : attr.type;
		attr.content = (attr.content == null) ? null : attr.content;
		
		var el = document.createElement(attr.type);
		if(attr.id!=null){ el.id = attr.id; }

		if(attr.class != null){ el.className = attr.class; }
		if(attr.style != null){ el.style.cssText = attr.style; }
		if(attr.src != null){ el.src = attr.src; }
		if(attr.info != null){ el.setAttribute('info', attr.info); }
		if(attr.content != null){ el.innerHTML = attr.content; }
		attr.parentElement.appendChild(el);
		return el;
	},
	
	/*** requesting server for JSON data ***/
	getJSON: function(url, callback){
		if(w.json[url] != null){
			w.debug({txt:'JSON: loaded already'});
			w.callback(w.json[url]);
		} else {
			w.debug({txt:'JSON: loading started'});
			w.callback = callback;
			w.requestUrl = url;
			w.waitround = 0;
			w.httpReq = new XMLHttpRequest();
			w.httpReq.open("GET",url,true);
		    w.httpReq.setRequestHeader("Accept", "application/json");
			w.httpReq.send(null);
			w.waitForJSON();
		}
	},
	
	/*** waiting for server-response ***/
	waitForJSON: function(){
		w.waitround++;
		if(w.httpReq.readyState === 4){
			w.debug({txt:'JSON: loading complete'});
			w.json[w.requestUrl] = JSON.parse(w.httpReq.response);
			w.callback(w.json[w.requestUrl]);
		}
		else if(w.waitround === 10){
			if(console){ console.error('Server not responding. Script execution aborted'); }
			return false;
		}
		else{
			w.debug({txt:'JSON: loading wait ' + w.waitround});
			window.setTimeout(w.waitForJSON,200);
		}
	},
	
	/*** writing out debug information switch w.showDebugInforamtion = true ***/
	debug: function(obj){
		if(w.showDebugInforamtion){
			if(console){ 
				console.log(obj); 
			}
		}
	}
};

google.load('search', '1');
var imageSearch;

window[ addEventListener ? 'addEventListener' : 'attachEvent' ] ( addEventListener ? 'load' : 'onload', w.init );
