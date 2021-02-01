export function create2dCanvas(divId, width, height) {
    let canvas = document.createElement("canvas");
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    document.getElementById(divId).appendChild(canvas);
    return canvas.getContext("2d");
}