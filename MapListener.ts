module TiledChunks
{
    export class MapListener {

        event: string;
        callback: Object;

        constructor(_event: string, _callback: Object) {
            this.event = _event;
            this.callback = _callback;
        }

    }
}