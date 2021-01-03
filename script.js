/* VERIFICATION JSHINT OK */
var JOURSPASSES=[0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
var CONVERT = 180 / Math.PI;
/* AJOUT DE 31 RANGÉES DE 7 CELLULES */
$("#table_sun").append(function() {
	var rangee = "";
	for (var i = 1; i < 32; i++) {
		rangee += "<tr class='jour'>" +
		"<td>" + i + "</td>" +
		"<td id = \"c" + i + "1\"></td>" +
		"<td id = \"c" + i + "2\"></td>" +
		"<td id = \"c" + i + "3\"></td>" +
		"<td id = \"c" + i + "4\"></td>" +
		"<td id = \"c" + i + "5\"></td>" +
		"<td id = \"c" + i + "6\"></td>" +
		"</tr>";
	}
	return rangee;
});
function testData(str, lim) {
	/* TEST DES ENTRÉES CLIENTS : CARACTÈRES ET LIMITE 
	les entrées client doivent comporter 1, 2 ou 3 chiffres
	et rien d'autre  et respecter la limite */
	var patt = /^[0-9]{1,3}$/;
	if(!patt.test(str) || parseInt(str, 10) > lim) {
		return false;
	} else {
		return true;
	}
}
function coordonneedecimale(signe, degres, minutes, secondes) {
	/* CONVERTIT ANGLE SEXAGÉSIMAL EN ANGLE DÉCIMAL EN RADIANS */
	var angle = degres + minutes / 60 + secondes / 3600;
	return signe * angle / CONVERT;		
}
function getlatitude() {
	/* AQUISITION LATITUDE ; RETOURNE LATITUDE EN RADIANS */
	var t = $("#opt1").val();
	var x = $("#deg1").val();
	var y = $("#min1").val() || "0";
	var z = $("#sec1").val() || "0";
	if(testData(x, 90) && testData(y, 60) && testData(z, 60)) {
		t = parseInt(t, 10);
		x = parseInt(x, 10);
		y = parseInt(y, 10);
		z = parseInt(z, 10);
		return coordonneedecimale(t, x, y, z);
	}else{
		$("#alerte").toggleClass("invisible");
		return false;
	}
}
function getlongitude() {
	/* AQUISITION LONGITUDE : RETOURNE LONGITUDE EN RADIANS */
	var t = $("#opt2").val();
	var x = $("#deg2").val();
	var y = $("#min2").val() || "0";
	var z = $("#sec2").val() || "0";
	if(testData(x, 180) && testData(y, 60) && testData(z, 60)) {
		t = parseInt(t, 10);
		x = parseInt(x, 10);
		y = parseInt(y, 10);
		z = parseInt(z, 10);
		return coordonneedecimale(t, x, y, z);
	} else {
		$("#alerte").toggleClass("invisible");
		return false;
	}
}
function getdata() {
	/* IMPORTATION DES DONNÉES FORMULAIRE */
	var lat = getlatitude();
	var lon = getlongitude();
	var mois = parseInt($("#mois").val());
	var fh = parseInt($("#fh").val());
	if(fh >= -12 && fh <= 12) {
		return [lat,lon,mois,fh];
	} else {
		$("#alerte").toggleClass("invisible");
		return false;
	}
}
function affiche(q,results) {
	/* AFFICHE LES 6 VALEURS DE RESULTS DANS LES CELLULES DE RANG q */
	for(var j = 1 ; j < 7 ; j++) {
		$("#c" + q + j).text(results[j - 1]);
	}
}
function convertsexa(x) {
	/* CONVERTIT LES HEURES DÉCIMALES EN CHAINE "HEURES MINUTES" */
	var heures = Math.floor(x);
	if(x - heures > 0.9916666667) {
		heures = heures + 1;
		return heures + " h 00";
	} else {
		var minutes = Math.round((x - heures) * 60);
		if(minutes < 10) {
			return heures + " h 0" + minutes;
		} else {
			return heures + " h " + minutes;
		}
	}
}
function effacer() {
	/* EFFACE TOUT LE FORMULAIRE */
	for(var q = 1 ; q < 32 ; q++) {
		for(var j = 1 ; j < 7 ; j++) {
			$("#c" + q + j).text("");
		}
	}
}
/* CONSTRUCTION DE L'OBJET EVENT */
function Event(data, q) {
	/* 
	data contient :
	- lat pour latitude en radians
	- lon pour longitude en radians
	- mois pour numero du mois (nombre entier de 1 à 12)
	- fh pour fuseau horaire en heures (fh>0 à l'est de Greenwich ; heure locale = UTC + fh)
	q  pour quantieme du mois (nombre entier de 1 à 31)
	*/
	this.lat = data[0];
	this.lon = data[1];
	this.mois = data[2];
	this.fh = data[3];
	this.q = q;
	/* j numéro du jour de l'année */
	this.j = JOURSPASSES[this.mois - 1] + this.q;
	this.getdeclinaison = function() {
		/* RETOURNE LA DÉCLINAISON EN RADIANS */
		var a = 2 * Math.PI * (this.j - 1) / 365;
		var dec = 0.006918 -
		0.399912 * Math.cos(a) + 0.070257 * Math.sin(a) -
		0.006758 * Math.cos(2 * a) + 0.000907 * Math.sin(2 * a) -
		0.002697 * Math.cos(3 * a) + 0.00148 * Math.sin(3 * a);
		return dec;
	};
	this.getequatemps = function() {
		/* RETOURNE L'ÉQUATION DU TEMPS EN HEURES DÉCIMALES */
		var M = (357.5291 + 0.98560028 * this.j) / CONVERT;
		var C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
		var L = (280.4665 + C + 0.98564736 * this.j) / CONVERT;
		var R = -2.468 * Math.sin(2 * L) + 0.053 * Math.sin(4 * L) - 0.0014 * Math.sin(6 * L);
		return (C + R) / 15;
	};
	this.gethauteur = function() {
		/* RETOURNE LA HAUTEUR DE CULMINATION EN DEGRÉS */
		return 90 - (this.lat - this.dec) * CONVERT;
	};
	this.getheuremeridien = function() {
		/* RETOURNE L'HEURE LÉGALE DE PASSAGE AU MÉRIDIEN DU LIEU */
		return (12 + this.lon * CONVERT / 15 + this.eqt + this.fh) % 24;
	};
	/* EXÉCUTION DES CALCULS ET CRÉATION DU TABLEAU DES RÉSULTATS */
	this.dec = this.getdeclinaison();
	this.eqt = this.getequatemps();
	this.haut = this.gethauteur();
	this.heuremeridien = this.getheuremeridien();
	var cosgha = (-0.01396218 - Math.sin(this.dec) * Math.sin(this.lat)) / Math.cos(this.dec) / Math.cos(this.lat);
	var cosazi  =(Math.sin(this.dec) + 0.010471784 * Math.sin(this.lat)) / 0.999902524 / Math.cos(this.lat);
	if (cosgha >= -1 && cosgha <= 1 && cosazi >= -1 && cosazi <= 1) {
		var gha = Math.acos(cosgha);
		this.heurelever = (24 + this.heuremeridien - gha * 12 / Math.PI) % 24;
		this.heurecoucher = (24 + this.heuremeridien + gha * 12 / Math.PI) % 24;
		this.azilever = Math.acos(cosazi) * CONVERT;
		this.azicoucher = 360 - this.azilever;
		this.results = [convertsexa(this.heurelever), Math.round(this.azilever), convertsexa(this.heuremeridien), 
		Math.round(this.haut), convertsexa(this.heurecoucher), Math.round(this.azicoucher)];
	} else {
		this.heurelever = "-";
		this.heurecoucher = "-";
		this.azilever = "-";
		this.azicoucher = "-";
		if(this.haut > -2) {
			this.results = [this.heurelever, this.azilever, convertsexa(this.heuremeridien), 
			Math.round(this.haut), this.heurecoucher, this.azicoucher];
		} else {
			this.haut = "-";
			this.heuremeridien = "-";
			this.results = [this.heurelever, this.azilever, this.heuremeridien, 
			this.haut, this.heurecoucher, this.azicoucher];
		}
	}
}
function main() {
	/* CRÉATION DES INSTANCES DE EVENT POUR CHAQUE JOUR DU MOIS ET AFFICHAGE DES RÉSULTATS */
	var data, m, q, sun, results;
	effacer();
	data = getdata();
	m = data[2];
	if (m == 2) {
		for (q = 1 ; q < 29 ; q++) {
			sun = new Event(data, q);
			results = sun.results;
			affiche(q, results);
		}
	} else if (m == 4 || m == 6 || m == 9 || m == 11) {
		for (q = 1 ; q < 31 ; q++) {
			sun = new Event(data, q);
			results = sun.results;
			affiche(q, results);
		}
	} else {
		for (q = 1 ; q < 32 ; q++) {
			sun = new Event(data, q);
			results = sun.results;
			affiche(q, results);
		}
	}
}
/* DÉCLENCHEMENT DU PROGRAMME */
$(document).ready(function(){
    $("#calculer").on("click",main);
});
/* DÉCLENCHEMENT DE L'EFFACEMENT DES RÉSULTATS */
$(document).ready(function(){
    $("#effacer").on("click",effacer);
});