"""
Geohash utility module for spatial partitioning in Spark and ML jobs.
Supports encoding (lat, lon) to base32 geohash strings and decoding.
Used for SF Bay Area grid partitioning and OD matrix aggregation.
"""

BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
DEC_MAP = {c: i for i, c in enumerate(BASE32)}

def encode_geohash(lat: float, lon: float, precision: int = 6) -> str:
    """
    Encode latitude and longitude into Geohash string.
    Precision 6 corresponds to approximately 1.2km x 0.6km grid cell.
    """
    lat_interval = [-90.0, 90.0]
    lon_interval = [-180.0, 180.0]
    geohash = []
    bits = [16, 8, 4, 2, 1]
    bit = 0
    ch = 0
    even = True

    while len(geohash) < precision:
        if even:
            mid = (lon_interval[0] + lon_interval[1]) / 2.0
            if lon > mid:
                ch |= bits[bit]
                lon_interval[0] = mid
            else:
                lon_interval[1] = mid
        else:
            mid = (lat_interval[0] + lat_interval[1]) / 2.0
            if lat > mid:
                ch |= bits[bit]
                lat_interval[0] = mid
            else:
                lat_interval[1] = mid

        even = not even
        if bit < 4:
            bit += 1
        else:
            geohash.append(BASE32[ch])
            bit = 0
            ch = 0

    return "".join(geohash)

def decode_geohash(geohash: str):
    """
    Decode geohash string into latitude and longitude center coordinate.
    Returns: (lat, lon, lat_err, lon_err)
    """
    lat_interval = [-90.0, 90.0]
    lon_interval = [-180.0, 180.0]
    even = True

    for char in geohash.lower():
        if char not in DEC_MAP:
            continue
        cd = DEC_MAP[char]
        for mask in [16, 8, 4, 2, 1]:
            if even:
                mid = (lon_interval[0] + lon_interval[1]) / 2.0
                if cd & mask:
                    lon_interval[0] = mid
                else:
                    lon_interval[1] = mid
            else:
                mid = (lat_interval[0] + lat_interval[1]) / 2.0
                if cd & mask:
                    lat_interval[0] = mid
                else:
                    lat_interval[1] = mid
            even = not even

    lat = (lat_interval[0] + lat_interval[1]) / 2.0
    lon = (lon_interval[0] + lon_interval[1]) / 2.0
    lat_err = (lat_interval[1] - lat_interval[0]) / 2.0
    lon_err = (lon_interval[1] - lon_interval[0]) / 2.0
    return lat, lon, lat_err, lon_err
