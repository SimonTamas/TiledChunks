module TiledChunks {
    
    export class Tileset {

        name: string;
        fromID: number;
        toID: number;
        textureKey: string;
        properties: Object;

        public GetFrameFromId(_id: number) {
            return _id - this.fromID;
        }

        public GetPropertyValueFromId(_id: number, _property: string): string {
            var frame: number = this.GetFrameFromId(_id);
            return this.properties && this.properties[frame] && this.properties[frame][_property];
        }

        constructor(_name: string, _textureKey)
        {
            this.name = _name;
            this.textureKey = _textureKey;
        }

    }
}