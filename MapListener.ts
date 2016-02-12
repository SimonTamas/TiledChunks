module TiledChunks
{
    export class MapListener {

        sprite: Phaser.Sprite;
        event: string;
        callback: Function;

        constructor(_sprite: Phaser.Sprite, _event: string, _callback: Function) {
            this.sprite = _sprite;
            this.event = _event;
            this.callback = _callback;
        }

    }
}