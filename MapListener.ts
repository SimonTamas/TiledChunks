module TiledChunks
{
    export class MapListener {

        sprite: Phaser.Sprite;
        event: number;
        callback: Function;
        callbackContext: Object;

        constructor(_sprite: Phaser.Sprite, _event: number, _callback: Function, _callbackContext: Object) {
            this.sprite = _sprite;
            this.event = _event;
            this.callback = _callback;
            this.callbackContext = _callbackContext;
        }

    }
}