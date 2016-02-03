module TiledChunks {

    export class TileData {

        id: number;
        textureFrame: number;
        textureKey: string;
        collides: boolean;

        constructor(_id: number, _collides?: boolean) {
            this.id = _id;
            this.collides = _collides || false;
        }

    }

}