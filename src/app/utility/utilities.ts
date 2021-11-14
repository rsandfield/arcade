/**
 * Clamps a number to within a given range, inclusive
 * @param number Number to be restricted
 * @param min Minimum value
 * @param max Maximum value
 * @returns Number, within the range of min and max
 */
export function clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(max, number));
}

/**
 * Clamps a number inclusively to within a given range, looping if it exceeds
 * @param number Number to be restricted
 * @param min Minimum value
 * @param max Maximum value
 * @returns Number, within the range of min and max
 */
export function clampLooping(number: number, min: number, max: number) {
    let range = max - min;
    while(number < min) number += range;
    while(number > max) number -= range;
    return number;
}

/**
 * Why is this not included in Math?!?
 * @param min Minimum value
 * @param max Maximum value
 * @returns Random float within the given range
 */
export function random(min: number, max: number) {
    return min + Math.random() * (max - min);
}

/**
 * Why is this not included in Math?!?
 * @param min Minimum value
 * @param max Maximum value
 * @returns Random integer within the given range
 */
export function randomInt(min: number, max: number) {
    return Math.round(random(min, max));
}

/**
 * Converts a set of RGBA values on the 0-1 scale into a string as used by CSS
 * @param r Red value
 * @param g Green value
 * @param b Blue value
 * @param a Alpha balue
 * @returns String representing RGB value on scale of 0-255
 */
export function rgbValuesToString(r: number, g: number, b: number, a: number = 1) {
    return "rgb" + 
    shortString(clamp(r, 0, 1) * 255, 5) + ", " +
    shortString(clamp(g, 0, 1) * 255, 5) + ", " +
    shortString(clamp(b, 0, 1) * 255, 5) + ", " +
    shortString(clamp(a, 0, 1) * 255, 5) + ", "
}

/**
 * Converts a number into a string of restricted length
 * @param number Number to be converted
 * @param length Maximum length
 * @returns Truncated string representation of number
 */
export function shortString(number: number, length:number) {
	return number.toString().substring(0, length);
}

/**
 * 
 * @param number Number to be converted
 * @param decimals 
 * @returns 
 */
export function decimalPlace(number: number, decimals: number) {
	let pow = Math.pow(10, decimals);
	return Math.floor(number * pow) / pow
}

/**
 * 
 * @param number Number to be converted
 * @param sigfigs Number of significant figures to use
 * @returns 
 */
export function scientificNotation(number:number, sigfigs = 3): string {
    let log = Math.floor(Math.log10(number));
	if(isFinite(number)) return shortString(number * Math.pow(10, -log), sigfigs + 2) + "e" + log;
	return number.toString();
}

/**
 * Converts a UTC formatted date code into a Date object
 * @param text UTC date YYYY MM DD HH MM SS MS
 * @returns Date representing inputted text
 */
export function textToDate(text: string): Date {
    let parts = text.split(' ').filter(i => i).map(part => {return Number.parseInt(part)});
    while(parts.length < 7) parts.push(0);
    return new Date(Date.UTC(parts[0], parts[1], parts[3], parts[4], parts[5], parts[6]));
}

export function addTimeToDate(date: Date, time: number) {
    return new Date(date.getTime() + time);
}