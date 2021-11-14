import { Container, Rectangle, TextBlock } from "@babylonjs/gui";

export class statBlock {
    
}

export class StatText {
    container: Container;
    constructor(public label: string, public value: string, public unit: string, settings?: {}) {
        this.container = new Container();
    }
}

export function createStatText(container: Rectangle, offsetY: number, settings?: {fontSize: number}) {
    let label = new TextBlock();
    label.color = "white";
    label.horizontalAlignment = 0;
    label.resizeToFit = true;
    label.fontSize = settings?.fontSize || 12;
    label.top = offsetY + "px";
    container.addControl(label);
    return label;
}