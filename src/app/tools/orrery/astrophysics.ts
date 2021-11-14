export class AstralConstants {
    static readonly G = 6.67428 * 10 ** -11;
    static readonly STEFAN_BOLTZMAN = 5.670373 * 10 ** -8;
    static readonly PI_2 = Math.PI * 2;

    static readonly SOLAR_LUMINOSITY = 3.939 * 10 ** 26;

    static readonly EARTH_MASS = 5.972 * 10 ** 24;
    static readonly JUPITER_MASS = 1.898 * 10 ** 27;
    static readonly SOLAR_MASS = 1.98855 * 10 ** 30;

    static readonly EARTH_RADIUS = 6.371 * 10 ** 6;
    static readonly LUNAR_DISTANCE = 3.844 * 10 ** 8;
    static readonly SOLAR_RADIUS = 6.9634 * 10 ** 9;
    static readonly ASTRONOMICAL_UNIT = 1.674 * 10 ** 11;
    static readonly LIGHT_YEAR = 9.4607 * 10 ** 15;
    static readonly PARSEC = 3.0857 * 10 ** 16;

}

export class Astrophysics {
    static newtonsApproximation (meanAnomaly: number, eccentricity: number, prior?: number) {
        if(!prior || isNaN(prior)) return meanAnomaly;
        return prior -
            (prior - eccentricity * Math.sin(prior) - meanAnomaly) /
            (1 - eccentricity * Math.cos(prior));
    }
    
    static approximateEccentricAnomaly (meanAnomaly: number, eccentricity: number, maxIterations = 20) {
        let last = meanAnomaly;
        for(let i = 0; i < maxIterations; i++) {
            let next = Astrophysics.newtonsApproximation(meanAnomaly, eccentricity, last);
            if(next == last) break;
            last = next;
        }
        return last;
    }
}

export class PlanetaryPhysics {
    /**
     * Calculates the approximate radius of a sub-stellar astronomical body
     * from the combined partial masses in kilograms of three classes of
     * material
     * @param volitiles Water and other volitile material
     * @param lithics Silicon and other lithophilic material
     * @param metals Iron and other metallic material
     * @returns Radius of body in meters
     */
    static radiusFromPartialMasses (volitiles: number, lithics: number, metals: number) {
        let total = volitiles + lithics + metals;
        return AstralConstants.EARTH_RADIUS * PlanetaryPhysics.radiusFromMassAndFractions(
            total,
            volitiles / total,
            lithics / total,
            metals / total
        );
    }

    /**
     * Calculates the approximate radius of a sub-stellar astronomical body
     * from the total mass in kilograms and mass fractions of three classes
     * of material
     * @param total Total mass in kilograms
     * @param volitiles Water and other volitile material
     * @param lithics Silicon and other lithophilic material
     * @param metals Iron and other metallic material
     * @returns Radius of body in meters
     */
    static radiusFromMassAndFractions(total: number, volitiles: number, lithics: number, metals: number) {
        // Make sure ratio total is not greater than 1
        let ratioSum = volitiles + lithics + metals;
        volitiles /= ratioSum;
        lithics /= ratioSum;
        metals /= ratioSum;

        let density = (1 / (volitiles + (lithics / 3.5) + (metals / 7.8)));

        if(total < 0.01 * AstralConstants.EARTH_MASS) {
            return PlanetaryPhysics.radiusUncompressFromMassAndDensity(total, density * 1000);
        }

        if(density < 3.5) {
            return PlanetaryPhysics.radiusCompressedWaterRockPlanet(total, (1.4/density) - 0.4);
        } else {
            return PlanetaryPhysics.radiusCompressedRockMetalPlanet(total, (6.369/density) - 0.8140);
        }
    }

    /**
     * Calculates the approximate radius of a sub-stellar astronomcial body
     * from the mass in earth masses, assuming that gravitational compression
     * does not come into lpay
     * @param mass Mass in kilograms
     * @param density Average density of material in kg/m3
     * @returns Radius of body in earth radii
     */
    static radiusUncompressFromMassAndDensity(mass: number, density: number) {
        let volume = mass / density;
        let radius = (volume * 0.75 / Math.PI) ** (1/3);
        return radius;
    }

    static radiusCompressedWaterRockPlanet(mass: number, volitileFraction: number) {
        mass /= AstralConstants.EARTH_MASS;
        return AstralConstants.EARTH_RADIUS * (
            (0.0912 * volitileFraction + 0.1603) * (Math.log10(mass) ** 2) +
            (0.3330 * volitileFraction + 0.7387) * Math.log10(mass) +
            0.4639 * volitileFraction + 1.1193
        );
    }

    static radiusCompressedRockMetalPlanet(mass: number, lithicFraction: number) {
        mass /= AstralConstants.EARTH_MASS;
        return AstralConstants.EARTH_RADIUS * (
            (0.0592 * lithicFraction + 0.0975) * (Math.log10(mass) ** 2) +
            (0.2337 * lithicFraction + 0.4938) * Math.log10(mass) +
            0.3102 * lithicFraction + 0.7932
        );
        //*/
    }
}