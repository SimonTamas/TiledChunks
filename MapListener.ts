module TiledChunks
{
    export class MapListener {

        event: string;
        callback: Function;

        constructor(_event: string, _callback: Function) {
            this.event = _event;
            this.callback = _callback;
        }

    }
}