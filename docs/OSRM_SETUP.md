# OSRM Routing Service for Venezuela

This guide explains how to set up the OSRM routing engine for calculating accurate delivery routes in Venezuela.

## Architecture

```
docker/osrm/data/
├── venezuela-latest.osm.pbf     ← Original map (~101MB)
├── venezuela-latest.osrm        ← Processed data (~223MB)
├── venezuela-latest.osrm.*      ← Additional data files (~800MB)
└── ... (28 total files, ~1.1GB)
```

## Quick Start

### 1. Prepare the Data (one-time setup)

If you have the `.osm.pbf` file in the project root, run:

```powershell
# Create data directory
New-Item -ItemType Directory -Force -Path "docker/osrm/data"

# Copy map file
Copy-Item "venezuela-*.osm.pbf" -Destination "docker/osrm/data/venezuela-latest.osm.pbf"

# Process with OSRM (takes ~5 minutes)
docker run -t -v "${PWD}/docker/osrm/data:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/venezuela-latest.osm.pbf
docker run -t -v "${PWD}/docker/osrm/data:/data" osrm/osrm-backend osrm-partition /data/venezuela-latest.osrm
docker run -t -v "${PWD}/docker/osrm/data:/data" osrm/osrm-backend osrm-customize /data/venezuela-latest.osrm
```

### 2. Start OSRM with Docker Compose

```bash
# Start all services including OSRM
docker compose --profile routing up -d

# Or just OSRM
docker run -d -p 5000:5000 -v "${PWD}/docker/osrm/data:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/venezuela-latest.osrm
```

### 3. Test the API

```bash
# Route from Caracas to Maracaibo
curl "http://localhost:5000/route/v1/driving/-66.9036,10.4806;-71.6119,10.6427?overview=full"
```

Expected response: ~691km, ~10.5 hours

## Environment Variables

```env
OSRM_API_URL=http://localhost:5000
OSRM_TIMEOUT_MS=5000
```

## Fallback Behavior

If OSRM is unavailable, the `OsrmService` falls back to:

- **Haversine distance**: straight-line distance calculation
- **Estimated ETA**: based on 30 km/h average urban speed

This ensures the app works even offline or during OSRM maintenance.

## Files Generated

| File                  | Size   | Purpose            |
| --------------------- | ------ | ------------------ |
| `*.osrm`              | 223MB  | Main routing graph |
| `*.osrm.cell_metrics` | 198MB  | MLD cell metrics   |
| `*.osrm.geometry`     | 98MB   | Road geometry      |
| `*.osrm.mldgr`        | 87MB   | MLD graph          |
| ...                   | ~500MB | Additional files   |

**Total storage required: ~1.1GB**
