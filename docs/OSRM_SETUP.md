# OSRM Routing Service for Venezuela

This directory contains the configuration for running OSRM (Open Source Routing Machine) locally with the Venezuela road network.

## Quick Start

### 1. Prepare the Data (one-time setup)

The Venezuela map file is already at `docs/venezuela-251206.osm.pbf`.

First, extract and prepare the OSRM data:

```bash
# Navigate to docs directory
cd docs

# Extract (creates .osrm files)
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/venezuela-251206.osm.pbf

# Partition
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-partition /data/venezuela-251206.osrm

# Customize
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-customize /data/venezuela-251206.osrm
```

### 2. Run OSRM Server

```bash
docker run -t -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/venezuela-251206.osrm
```

### 3. Test the API

```bash
# Route from Caracas to Maracaibo
curl "http://localhost:5000/route/v1/driving/-66.9036,10.4806;-71.6119,10.6427?overview=full"
```

## Environment Variables

Set in your `.env` file:

```env
OSRM_API_URL=http://localhost:5000
OSRM_TIMEOUT_MS=5000
```

## Using docker-compose

Add this service to your `docker-compose.yml`:

```yaml
services:
  osrm:
    image: osrm/osrm-backend
    command: osrm-routed --algorithm mld /data/venezuela-251206.osrm
    volumes:
      - ./docs:/data
    ports:
      - '5000:5000'
    restart: unless-stopped
```

## Fallback Behavior

If OSRM is unavailable, the OsrmService falls back to:

- **Haversine distance**: straight-line distance calculation
- **Estimated ETA**: based on 30 km/h average urban speed

This ensures the app works even offline or during OSRM maintenance.
