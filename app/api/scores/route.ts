import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'base-rocket';
const COLLECTION_NAME = 'scores';

let client: MongoClient;

async function getMongoClient() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client;
}

export async function GET() {
  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Get the highest score for each unique user (by FID or wallet address)
    const scores = await collection.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $ne: ["$userFid", null] },
              "$userFid",
              "$userAddress"
            ]
          },
          maxScore: { $max: "$score" },
          playerName: { $first: "$playerName" },
          userAddress: { $first: "$userAddress" },
          userPfp: { $first: "$userPfp" },
          userFid: { $first: "$userFid" },
          timestamp: { $max: "$timestamp" }
        }
      },
      {
        $project: {
          _id: 1,
          score: "$maxScore",
          playerName: 1,
          userAddress: 1,
          userPfp: 1,
          userFid: 1,
          timestamp: 1
        }
      },
      {
        $sort: { score: -1, timestamp: -1 }
      },
      {
        $limit: 50
      }
    ]).toArray();

    return NextResponse.json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { score, playerName, userAddress, userPfp, userFid, txHash } = await request.json();

    if (!score || typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const mongoClient = await getMongoClient();
    const db = mongoClient.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const scoreEntry = {
      score: Math.floor(score),
      playerName: playerName.trim(),
      userAddress: userAddress || '',
      userPfp: userPfp || '',
      userFid: userFid || null,
      txHash: txHash || '',
      timestamp: new Date(),
    };

    // Check if user already has a score (by FID or wallet address)
    const existingScore = await collection.findOne({
      $or: [
        { userFid: userFid },
        { userAddress: userAddress }
      ].filter(condition => condition.userFid || condition.userAddress)
    });

    let result;
    if (existingScore) {
      // Update existing score if new score is higher
      if (scoreEntry.score > existingScore.score) {
        result = await collection.updateOne(
          { _id: existingScore._id },
          { 
            $set: {
              score: scoreEntry.score,
              playerName: scoreEntry.playerName,
              userPfp: scoreEntry.userPfp,
              timestamp: scoreEntry.timestamp
            }
          }
        );
        return NextResponse.json({ 
          success: true, 
          id: existingScore._id,
          score: { ...scoreEntry, _id: existingScore._id },
          updated: true,
          message: 'Score updated!'
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          id: existingScore._id,
          score: existingScore,
          updated: false,
          message: 'Your previous score was higher!'
        });
      }
    } else {
      // Create new score entry
      result = await collection.insertOne(scoreEntry);
      return NextResponse.json({ 
        success: true, 
        id: result.insertedId,
        score: scoreEntry,
        updated: false,
        message: 'New score saved!'
      });
    }
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
