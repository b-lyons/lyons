# WGS84 <-> RGF93 / CC48 (EPSG:3948), the projected CRS the cadastral grid uses.
#
# OSM serves lat/lon; cadastre_grid.json's meta is in CC48 metres and
# build_map.py's world_to_grid() expects those metres. This bridges the two so
# OSM vector geometry can be rasterised onto exactly the same grid.
#
# Lambert Conformal Conic 2SP on GRS80. Kept dependency-free on purpose: pyproj
# isn't installed and this is ~30 lines of standard formulae.
import math

A = 6378137.0
F = 1 / 298.257222101
E = math.sqrt(2 * F - F * F)

LAT1, LAT2 = math.radians(47.25), math.radians(48.75)
LAT0, LON0 = math.radians(48.0), math.radians(3.0)
X0, Y0 = 1700000.0, 7200000.0


def _m(p):
    return math.cos(p) / math.sqrt(1 - E * E * math.sin(p) ** 2)


def _t(p):
    return math.tan(math.pi / 4 - p / 2) / ((1 - E * math.sin(p)) / (1 + E * math.sin(p))) ** (E / 2)


N = (math.log(_m(LAT1)) - math.log(_m(LAT2))) / (math.log(_t(LAT1)) - math.log(_t(LAT2)))
BIGF = _m(LAT1) / (N * _t(LAT1) ** N)
RHO0 = A * BIGF * _t(LAT0) ** N


def wgs84_to_cc48(lat, lon):
    p, l = math.radians(lat), math.radians(lon)
    rho = A * BIGF * _t(p) ** N
    theta = N * (l - LON0)
    return (X0 + rho * math.sin(theta), Y0 + RHO0 - rho * math.cos(theta))


def cc48_to_wgs84(x, y):
    dx, rp = x - X0, RHO0 - (y - Y0)
    rho = math.copysign(math.hypot(dx, rp), N)
    theta = math.atan2(dx, rp)
    tt = (rho / (A * BIGF)) ** (1 / N)
    p = math.pi / 2 - 2 * math.atan(tt)
    for _ in range(12):
        p = math.pi / 2 - 2 * math.atan(tt * ((1 - E * math.sin(p)) / (1 + E * math.sin(p))) ** (E / 2))
    return (math.degrees(p), math.degrees(theta / N + LON0))
