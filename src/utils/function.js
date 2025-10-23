"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const User_1 = require("../entities/User");
const typeorm_1 = require("typeorm");
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCityAndStateFromCoordinates = exports.getAddressFromCoordinates = exports.generate_password = exports.distance_checker = exports.calculate_age = exports.calculateDistance = exports.calculate_distance_between_coordinates = exports.convert_degrees_To_radians = void 0;
const axios_1 = __importDefault(require("axios"));
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_DISTANCE_API_KEY;

const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const rekognition = new AWS.Rekognition();



const convert_degrees_To_radians = (degrees) => {
    return degrees * (Math.PI / 180);
};
exports.convert_degrees_To_radians = convert_degrees_To_radians;
const calculate_distance_between_coordinates = (lat1, lon1, lat2, lon2) => {
    const earthRadiusInKm = 6371;
    const deltaLatitude = (0, exports.convert_degrees_To_radians)(lat2 - lat1);
    const deltaLongitude = (0, exports.convert_degrees_To_radians)(lon2 - lon1);
    const a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
        Math.cos((0, exports.convert_degrees_To_radians)(lat1)) *
        Math.cos((0, exports.convert_degrees_To_radians)(lat2)) *
        Math.sin(deltaLongitude / 2) *
        Math.sin(deltaLongitude / 2);
    const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusInKm * centralAngle;
    return distance;
};
exports.calculate_distance_between_coordinates = calculate_distance_between_coordinates;
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};
exports.calculateDistance = calculateDistance;
const calculate_age = (dateString) => {
    const [day, month, year] = dateString.split("/").map(Number);
    const birthDate = new Date(year, month - 1, day);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassedThisYear = currentDate.getMonth() > birthDate.getMonth() ||
        (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() >= birthDate.getDate());
    if (!hasBirthdayPassedThisYear) {
        age--;
    }
    return age;
};
exports.calculate_age = calculate_age;
const distance_checker = (units, origins, destinations) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GOOGLE_DISTANCE_API_KEY;
        const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?units=${units}&origins=${origins}&destinations=${destinations}&key=${apiKey}`;
        axios_1.default.get(apiUrl)
            .then((response) => {
                var _a, _b;
                const distanceObj = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.rows[0]) === null || _b === void 0 ? void 0 : _b.elements[0];
                if (distanceObj === null || distanceObj === void 0 ? void 0 : distanceObj.distance) {
                    const distanceValue = distanceObj.distance.value;
                    const distanceText = distanceObj.distance.text;
                    resolve({ distance: distanceText, distanceValue });
                }
                else {
                    resolve("No distance information available.");
                }
            })
            .catch((error) => {
                console.error("Error fetching distance:", error.message || error);
            });
    });
};
exports.distance_checker = distance_checker;
const generate_password = (len) => {
    let password = "";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "1234567890";
    const special = "!@#$%&";
    const allChars = lowercase + uppercase + digits + special;
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += digits.charAt(Math.floor(Math.random() * digits.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    for (let i = password.length; i < len; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    return password;
};
exports.generate_password = generate_password;
const getAddressFromCoordinates = (lat, lon) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
                latlng: `${lat},${lon}`,
                key: GOOGLE_MAPS_API_KEY,
                language: "en",
            }
        });
        if (response.data.status === "OK" && response.data.results.length > 0) {
            const address = response.data.results[0].formatted_address;
            return address;
        }
        else {
            console.error("Geocoding failed:", response.data.status);
            return null;
        }
    }
    catch (error) {
        console.error("Error fetching address:", error);
        return null;
    }
});
exports.getAddressFromCoordinates = getAddressFromCoordinates;
const getCityAndStateFromCoordinates = (lat, lon) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
                latlng: `${lat},${lon}`,
                key: GOOGLE_MAPS_API_KEY,
                language: "en",
            },
        });
        if (response.data.status === "OK" && response.data.results.length > 0) {
            const addressComponents = response.data.results[0].address_components;
            let city = null;
            let state = null;
            for (const component of addressComponents) {
                const types = component.types;
                if (types.includes("locality")) {
                    city = component.long_name;
                }
                if (types.includes("administrative_area_level_1")) {
                    state = component.long_name;
                }
            }
            return { city, state };
        }
        else {
            console.error("Geocoding failed:", response.data.status);
            return null;
        }
    }
    catch (error) {
        console.error("Error fetching address:", error);
        return null;
    }
});
exports.getCityAndStateFromCoordinates = getCityAndStateFromCoordinates;

function getKeyFromS3Url(url) {
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Remove domain part
}

const listBlockedImagesFromS3 = async (folderPrefix) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: folderPrefix // e.g., 'blockedUsersImage/'
    };

    const result = await s3.listObjectsV2(params).promise();
    const keys = result.Contents.map(obj => obj.Key);
    console.log('Blocked image keys:', keys);
    return keys;
};
exports.listBlockedImagesFromS3 = listBlockedImagesFromS3;


const compareFaceWithBlockedUsers = async (userImageBuffer, user_id) => {
    console.log('Buffer length:', userImageBuffer.length);

    const userRepository = typeorm_1.getRepository(User_1.User);
    const blockedUsers = await userRepository.find({ where: { user_id } });

    if (!blockedUsers || blockedUsers.length === 0) {
        console.log('No user found');
        return { matched: false, error: 'User not found' };
    }

    if (blockedUsers[0].is_active == 0) {
        for (const user of blockedUsers) {
            const blockedImageUrl = user.profile_image;
            console.log('Blocked Image URL:', blockedImageUrl);

            if (!blockedImageUrl) continue;

            const key = getKeyFromS3Url(blockedImageUrl);
            if (!key || key.trim() === '') {
                console.error('Empty S3 key for user_id:', user.user_id);
                continue;
            }

            console.log('Bucket:', process.env.S3_BUCKET_NAME);
            console.log('Key:', key);

            // Detect face in uploaded buffer
            const detectBuffer = await rekognition.detectFaces({
                Image: { Bytes: userImageBuffer },
                Attributes: ['DEFAULT']
            }).promise();
            console.log('Uploaded Face Count:', detectBuffer);

            // Detect face in stored image
            const detectS3 = await rekognition.detectFaces({
                Image: { S3Object: { Bucket: process.env.S3_BUCKET_NAME, Name: key } },
                Attributes: ['DEFAULT']
            }).promise();
            console.log('S3 Face Count:', detectS3.FaceDetails.length);

            if (detectBuffer.FaceDetails.length === 0 || detectS3.FaceDetails.length === 0) {
                console.log('No face detected in one or both images.');
                continue;
            }

            const params = {
                SourceImage: { Bytes: userImageBuffer },
                TargetImage: {
                    S3Object: { Bucket: process.env.S3_BUCKET_NAME, Name: key }
                },
                SimilarityThreshold: 90
            };

            try {
                const result = await rekognition.compareFaces(params).promise();
                console.log('Compare Result:', JSON.stringify(result, null, 2));

                if (result.FaceMatches && result.FaceMatches.length > 0) {
                    console.log('Face matched with blocked user_id:', user.user_id);
                    return { matched: true, user_id: user.user_id };
                }
            } catch (err) {
                console.error('AWS Rekognition Error:', err.message);
            }
        }
    }

    return { matched: false };
};
exports.compareFaceWithBlockedUsers = compareFaceWithBlockedUsers;




