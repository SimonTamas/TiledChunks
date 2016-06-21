module TiledChunks
{
    export class MapListener {

        private map_listener_sprite: Phaser.Sprite;
        private map_listener_event: number;
        private map_listener_callback: Function;
        private map_listener_callback_context: Object;

        public GetSprite(): Phaser.Sprite {
            return this.map_listener_sprite;
        }

        public GetEvent(): number {
            return this.map_listener_event;
        }

        public GetCallback(): Function {
            return this.map_listener_callback;
        }

        public GetCallbackContext(): Object {
            return this.map_listener_callback_context;
        }

        constructor(_sprite: Phaser.Sprite, _event: number, _callback: Function, _callbackContext: Object) {

            this.map_listener_sprite = _sprite;
            this.map_listener_event = _event;
            this.map_listener_callback = _callback;
            this.map_listener_callback_context = _callbackContext;

        }

    }
}