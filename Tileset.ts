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
            var properties: Object = this.GetPropertiesFromId(_id)
            return properties && properties[_property] || "";
        }

        public GetPropertiesFromId(_id: number): Object {
            return this.properties && this.properties[this.GetFrameFromId(_id)];
        }

        constructor(_name: string, _textureKey?: string)
        {
            this.name = _name;
            this.textureKey = _textureKey;
        }

    }
}