/*
 * Copyright (c) 2013 Damien Legrand, Alfredo Torre
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

function SPARQL() {
    /**
     * ATTRIBUTES
     **/

    //The endpoint base URL without parameters
    this.baseUrl = "http://dbpedia.org/sparql";

    //The result's type
    this.format = "json";

	//The GET or POST parameter name for the query
	this.queryParam 	= "query";
	
	//The GET or POST parameter name for the result's format
	this.formatParam 	= "format";
	
	//GET or POST
	this.method 		= "GET";
	this.values		= "";
	
	//If you need to atache some information (will be return to the callback)
	this.info 			= null;
	
	//The SPARQL request
	this.sparql 		= "";
	
	//Arrays to build the request
	this.prefixes 		= [];
	this.distinctSelect 	= false;
	this.variables 		= [];
	this.wheres 		= [];
	this.orders		= [];
	this.limitNb		= null;
	this.offsetNb		= null;
	this.unions 		= []; //array of SPARQL object
	
	
	/**
	*
	* METHODS
	*
	**/
	
	this.prefixe 		= function(ns, x) 	{ this.prefixes.push("PREFIX " + ns + ": <" + x + ">"); return this; };
	this.distinct		= function(bool)	{ this.distinctSelect = bool; return this;}
	this.variable 		= function(x) 		{ this.variables.push(x); return this; };
	this.where 		= function(x, y, z) 	{ this.wheres.push(x + " " + y + " " + z); return this; };
	this.optionalWhere 	= function(x, y, z) 	{ this.wheres.push("OPTIONAL {" + x + " " + y + " " + z + "}"); return this; };
	this.union 		= function(x) 		{ this.unions.push(x); return this; };
	this.filter 		= function(x) 		{ this.wheres.push("FILTER ( " + x + " )"); return this; };
	this.orderBy 		= function(x) 		{ this.variables.push(x); return this; };
	this.limit 		= function(x) 		{ this.limitNb = x; return this; };
	this.offset 		= function(x) 		{ this.offestNb = x; return this; };
	this.setInfo		= function(x) 		{ this.info = x; return this; };
	
	this.build 		= function() {
		var sp = "";
		
		//PREFIXES
		for(var i = 0; i < this.prefixes.length; i++)
		{
			sp += this.prefixes[i] + "\n";
		}
		
		//VARIABLES
		sp += "SELECT ";
		
		if(this.distinctSelect) sp += "DISTINCT ";
		
		if(this.variables.length > 0)
		{
			var first = true;
			for(int = 0; i < this.variables.length; i++)
			{
				if(first) first = false;
				else if(i < this.variables.length) sp += " ";
				sp += this.variables[i];
			}
		}
		else sp += "*";
		
		//WHERES 
		sp += "\nWHERE";
		
		if(this.unions.length > 0) sp += "\n{";
		
		var w = this.buildWhere();
		
		sp += w;
		
		//UNIONS
		var first = true;
		for(var i = 0; i < this.unions.length; i++)
		{
			var u = this.unions[i].buildWhere();
			
			if(u != "")
			{			
				if(first)
				{
					first = false;
					if(w != "") sp += "UNION";
				}else sp += "UNION";
				
				sp += u;
			}
		}
		
		if(this.unions.length > 0) sp += "\n}\n";
		
		//ORDER BY
		if(this.orders.length > 0)
		{
			var first = true;
			for(var i = 0; i < this.orders.length; i++)
			{
				if(first) first = false;
				else if(i < this.orders.length) sp += ", ";
				sp += this.orders[i];
			}
		}
		
		//LIMIT
		if(this.limitNb != null) sp += "LIMIT " + this.limitNb + "\n";
		
		//OFFSET
		if(this.offsetNb != null) sp += "OFFSET " + this.offsetNb + "\n";
		
		return sp;
	}
	
	this.buildWhere = function() {
		var sp = "";
		if(this.wheres.length == 0) return sp;
		
		sp += "\n{\n";
		
		for(var i = 0; i < this.wheres.length; i++)
		{
			sp += this.wheres[i];
			if(i < this.wheres.length - 1) sp += " .";
			
			sp += "\n";
		}
		
		sp += "}\n";
		
		return sp;
	};
	
	this.execute = function(callback, generateDBPedia) {
		
		if(this.sparql == "") this.sparql = this.build();
		var cur = this;
		var data = {};
		data[this.formatParam] = this.format;
		data[this.queryParam] = this.sparql;
		$.ajax({
			type: this.method,
			url: this.baseUrl,
			data: data,
			dataType: this.format

		}).done(function( data ) {
			var ret = data;
			if(generateDBPedia == true && cur.format == 'json')
			{
				ret = [];
				var vars = [];
				for(var i = 0; i < data.results.bindings.length; i++)
				{
					var obj = {};
					for(var j = 0; j < data.head.vars.length; j++)
					{
						obj[data.head.vars[j]] = data.results.bindings[i][data.head.vars[j]]['value'];
						// sentenza
						console.dir(data.results.bindings[i]);
					}
					
					ret.push(obj);
				}
				
			}	
		
			callback(ret, cur.info);
			cur.sparql = "";
		});
	}

	
}
