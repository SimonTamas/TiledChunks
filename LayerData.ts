module TiledChunks {
    export class LayerData {

        name: string;
        emptyID: number;
        tileDatas: TiledChunks.TileData[][];
        isCollisionLayer: boolean;


        // Convert two dimension list of tile IDs ( from Tiled )
        // into TiledChunks.TileData for easy use
        public SetTiles(_tileList: number[][]): void {
            this.tileDatas = [];
            var id: number;
            for (var r: number = 0; r < _tileList.length; r++) {
                this.tileDatas[r] = [];
                for (var c: number = 0; c < _tileList[r].length; c++) {
                    id = _tileList[r][c];
                    if (id != this.emptyID)
                        this.tileDatas[r][c] = new TiledChunks.TileData(id);
                }
            }
            id = null;
        }

        public GetChunkLayer(_chunk: TiledChunks.Chunk): TiledChunks.ChunkLayer
        {
            var chunkTileDatas: TiledChunks.TileData[][] = [];
            if (this.tileDatas) {
                var id: number;
                var tileRow: number;
                var tileColumn: number;
                for (var rowOffset = 0; rowOffset < _chunk.map.data.chunkTileRows; rowOffset++) {
                    chunkTileDatas[rowOffset] = [];
                    for (var columnOffset = 0; columnOffset < _chunk.map.data.chunkTileColumns; columnOffset++) {
                        tileRow = (_chunk.row * _chunk.map.data.chunkTileRows) + rowOffset;
                        tileColumn = (_chunk.column * _chunk.map.data.chunkTileColumns) + columnOffset;
                        if (this.tileDatas[tileRow] && this.tileDatas[tileRow][tileColumn]) {
                            id = this.tileDatas[tileRow][tileColumn].id;
                            if (id != this.emptyID)
                                chunkTileDatas[rowOffset][columnOffset] = new TiledChunks.TileData(id);
                            else
                                chunkTileDatas[rowOffset][columnOffset] = null;
                        }

                    }
                }
                tileRow = null;
                tileColumn = null;
            }
            return new ChunkLayer(_chunk, this, chunkTileDatas);
        }

        constructor(_name: string, _emptyID?: number, _collision?: boolean)
        {
            this.name = _name;
            this.emptyID = _emptyID || 0;
            this.isCollisionLayer = _collision || false;
        }
        
    }
}