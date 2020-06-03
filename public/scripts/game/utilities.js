function clamp(a,b,c) {
	return Math.max(b,Math.min(c,a));
}

/**
* Takes three floats ranging 0-1 and returns CSS rgb value
*/
function rgb(r, g, b) {
	return "rgb(" +
		shortString((clamp(r, 0, 1) * 255), 5) + ", " +
		shortString((clamp(g, 0, 1) * 255), 5) + ", " +
		shortString((clamp(b, 0, 1) * 255), 5) + ")"
}

function shortString(number, length) {
	return number.toString().substring(0, length);
}

function scientificNotation(number) {
    let log = Math.floor(Math.log10(number));
	if(isFinite(number)) return shortString(number * Math.pow(10, -log), 4) + "e" + log;
	return number;
}