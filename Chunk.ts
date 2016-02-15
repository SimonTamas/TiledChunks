module TiledChunks {
    export class Chunk {

        static chunks: number = 0;

        map: TiledChunks.Map;
        row: number;
        column: number;
        x: number;
        y: number;
        active: boolean;
        deactivating: boolean;
        drawn: boolean;
        coord: TiledChunks.ChunkCoord;

        adjacentGraphicalChunks: TiledChunks.Chunk[];
        adjacentCollisionChunks: TiledChunks.Chunk[];
        
        layers: TiledChunks.ChunkLayer[];
        colliders: Phaser.Sprite[];
        triggers: TiledChunks.TriggerSprite[];

        /*
            When a camera enters a new chunk
            we prepare to deactivate chunks
        */
        public PrematureDeactivation(): void {
            this.deactivating = true;
        }


        /*
            Once the correct chunks have been activated we
            can deactivate the ones which didnt get activated
        */
        public DeactivationCheck(): void {
            if (this.deactivating)
                this.Deactivate();
        }

        /* ------------------------------------------------------------------------------------------ */
        /* ----------------------------------- DRAWING AND ERASING ---------------------------------- */
        /* ------------------------------------------------------------------------------------------ */
        private DrawChunk(): void {
            if (this.drawn)
                return;
            this.drawn = true;
            for (var l: number = 0; l < this.layers.length; l++) {
                this.layers[l].DrawLayer();
            }
        }

        private EraseChunk(): void {
            if (this.drawn) {
                this.drawn = false;
                for (var l: number = 0; l < this.layers.length; l++) {
                    this.layers[l].EraseLayer();
                }
            }
        }
        /* ------------------------------------------------------------------------------------------ */
        /* ----------------------------------- DRAWING AND ERASING ---------------------------------- 
        /* ------------------------------------------------------------------------------------------ */

        public Activate(): void {
            this.deactivating = false;
            if (!this.active) {
                this.active = true;
                this.map.chunksDrawn++;
                this.DrawChunk();
            }
        }

        public Deactivate(): void {
            if (this.active) {
                this.active = false;
                this.map.chunksDrawn--;
                this.EraseChunk();
            }
        }

        public ActivateAdjacent(): void {
            if (!this.adjacentGraphicalChunks)
                this.CacheAdjacentGraphicalChunks(this.map.data.chunkNeedCacheHorizontal, this.map.data.chunkNeedCacheVertical);
            for (var a: number = 0; a < this.adjacentGraphicalChunks.length; a++)
                this.adjacentGraphicalChunks[a].Activate();
        }
        

        public CacheAdjacentGraphicalChunks(_depthX: number, _depthY: number): void {
            this.adjacentGraphicalChunks = this.GetAdjacentChunks(_depthX, _depthY);
        }

        public CacheAdjacentCollisionChunks(): void {
            this.adjacentCollisionChunks = this.GetAdjacentChunks(0, 0);
        }

        public CacheAdjacentChunks(_depthX: number, _depthY: number, _cacheGraphical: boolean): void {
            if (_cacheGraphical)
                this.CacheAdjacentGraphicalChunks(_depthX, _depthY);
            this.CacheAdjacentCollisionChunks();
        }

        /*
            1 - UP & RIGHT
            2 - UP & LEFT
            3 - DOWN & LEFT
            4 - DOWN * RIGHT
        */

        public static MergeChunks(_chunks: TiledChunks.Chunk[], _withChunks: TiledChunks.Chunk[]): TiledChunks.Chunk[] {
            for (var c: number = 0; c < _withChunks.length; c++) {
                if (!TiledChunks.Chunk.ChunkInChunkArray(_withChunks[c], _chunks))
                {
                    _chunks.push(_withChunks[c]);
                }
            }
            return _chunks;
        }
        

        public GetAdjacentChunks(_depthX: number, _depthY: number, _direction?:number): TiledChunks.Chunk[] {
            

            var adjacent: TiledChunks.Chunk[] = [];

            // If this is being called recursivly
            // then we have a direction we came from
            if (_direction != null) {
                switch (_direction) {
                    case 1:
                        // UP
                        if (this.row - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row - 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row - 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        // RIGHT
                        if (this.column + 1 < this.map.data.chunkColumns) {
                            adjacent.push(this.map.chunks[this.row][this.column + 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column+1].GetAdjacentChunks(_depthX -1, _depthY, _direction)));
                        }
                    break;

                    case 2:
                        // UP
                        if (this.row - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row - 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row - 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        // LEFT
                        if (this.column - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row][this.column - 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column - 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                     break;

                    case 3:
                        // DOWN
                        if (this.row + 1 < this.map.data.chunkRows) {
                            adjacent.push(this.map.chunks[this.row + 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row + 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        // LEFT
                        if (this.column - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row][this.column - 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column - 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                    break;

                    case 4:
                        // DOWN
                        if (this.row + 1 < this.map.data.chunkRows) {
                            adjacent.push(this.map.chunks[this.row + 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row + 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        // RIGHT
                        if (this.column + 1 < this.map.data.chunkColumns) {
                            adjacent.push(this.map.chunks[this.row][this.column + 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column + 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                    break;
                }
            }
            else {
                // This is the center chunk 
                // lets go in 4 directions
                for (var d: number = 1; d < 5; d++) {
                    var chunksInDirection: TiledChunks.Chunk[] = this.GetAdjacentChunks(_depthX, _depthY, d);
                    for (var c: number = 0; c < chunksInDirection.length; c++) {
                        if (!TiledChunks.Chunk.ChunkInChunkArray(chunksInDirection[c], adjacent))
                            adjacent.push(chunksInDirection[c]);
                    }
                }

                // Now we need to add the 4 corners
                var furtestLeft: number = this.column;
                var furtestRight: number = this.column;
                var furtestTop: number = this.row;
                var furtestDown: number = this.row;
                var cC: number = 0;
                var cR: number = 0;
                for (var i: number = 0; i < adjacent.length; i++) {
                    cC = adjacent[i].coord.column;
                    cR = adjacent[i].coord.row;
                    if (cC > furtestRight)
                        furtestRight = cC;
                    else if (cC < furtestLeft)
                        furtestLeft = cC;
                    if (cR > furtestDown)
                        furtestDown = cR;
                    else if (cR < furtestTop)
                        furtestTop = cR;
                }
                TiledChunks.Chunk.MergeChunks(adjacent, [this.map.chunks[furtestTop][furtestLeft]]);
                TiledChunks.Chunk.MergeChunks(adjacent, [this.map.chunks[furtestTop][furtestRight]]);
                TiledChunks.Chunk.MergeChunks(adjacent, [this.map.chunks[furtestDown][furtestLeft]]);
                TiledChunks.Chunk.MergeChunks(adjacent, [this.map.chunks[furtestDown][furtestRight]]);
            }

            return adjacent;
        }
        


        public static ChunkInChunkArray(_chunk: TiledChunks.Chunk, _chunkArray: TiledChunks.Chunk[]) {
            var i: number = 0;
            while (i < _chunkArray.length && _chunkArray[i].coord.GetKey() != _chunk.coord.GetKey())
                i++;
            return i < _chunkArray.length;
        }

        public AddColliders(_chunkLayer: TiledChunks.ChunkLayer, _trigger?: boolean): void {
            var collisionX: number;
            var collisionY: number;
            var rect: any;
            var tileID: number;
            for (var r: number = 0; r < _chunkLayer.tiles.length; r++) {
                if (_chunkLayer.tiles[r]) {
                    for (var c: number = 0; c < _chunkLayer.tiles[r].length; c++) {
                        if (_chunkLayer.tiles[r][c] && _chunkLayer.tiles[r][c].data.id != _chunkLayer.layer.emptyID) 
                        {
                            tileID = _chunkLayer.tiles[r][c].data.id;

                            collisionX = _chunkLayer.chunk.x + ( c * this.map.data.tileWidth);
                            collisionY = _chunkLayer.chunk.y + (r * this.map.data.tileHeight);

                            if (_trigger) {
                                rect = new TiledChunks.TriggerSprite(this.map.game, collisionX, collisionY);
                                rect.anchor.set(0.5, 0.5);
                                this.triggers.push(rect);
                            }
                            else {
                                rect = new Phaser.Sprite(this.map.game, collisionX, collisionY);
                                this.colliders.push(rect);
                            }

                            this.map.game.physics.enable(rect, Phaser.Physics.ARCADE);
                            rect.name = this.map.data.GetTilesetForId(tileID).GetPropertyValueFromId(tileID, "name");
                            rect.body.setSize(this.map.data.tileWidth, this.map.data.tileHeight, 0, 0);
                            rect.body.immovable = true;
                        }
                    }
                }
            }
        }

        constructor(_map: TiledChunks.Map, _row: number, _column: number)
        {

            // Store vars
            this.map = _map;
            this.row = _row;
            this.column = _column;
            this.colliders = [];
            this.triggers = [];
            this.x = this.column * this.map.data.chunkWidth
            this.y = this.row * this.map.data.chunkHeight;
            

            // Easy way to keep track of the chunks
            this.coord = new TiledChunks.ChunkCoord(this.row, this.column);
            

            // Create the layers
            this.layers = [];
            var layerData: TiledChunks.LayerData;
            var chunkLayer: TiledChunks.ChunkLayer;
            for (var l: number = 0; l < this.map.data.layers.length; l++) {
                layerData = this.map.data.layers[l];
                chunkLayer = layerData.GetChunkLayer(this);
                if (layerData.isCollisionLayer)
                    this.AddColliders(chunkLayer, layerData.isTriggerLayer);
                this.layers.push(chunkLayer);
            }

           

            // Nullify localizations
            // for garbage collection
            layerData = null;
            
            Chunk.chunks++;
        }

    }
}