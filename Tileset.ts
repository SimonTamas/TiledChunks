module TiledChunks {
    
    export class Tileset {

        name: string;
        fromID: number;
        toID: number;
        textureKey: string;


        public GetFrameFromId(_id: number) {
            return _id - this.fromID;
        }

        constructor(_name: string, _textureKey)
        {
            this.name = _name;
            this.textureKey = _textureKey;
        }

    }
}