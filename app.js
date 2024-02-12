const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`Error: ${error.message}`)
  }
}
initializeDBandServer()

//API 1
const getPlayerDetails = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const allPlayersDetailsQuery = `
    SELECT 
        *
    FROM    
        player_details;
    `
  const allPlayersDetailsArray = await db.all(allPlayersDetailsQuery)
  response.send(
    allPlayersDetailsArray.map(eachPlayer => getPlayerDetails(eachPlayer))
  )
})

//API 2

app.get('/players/:player_id', async (request, response) => {
  const {playerId} = request.params
  const getPlayerDetailsQuery = `
    SELECT 
        *
    FROM 
        player_details
    WHERE   
        player_id = ${playerId};
    `
  const playerDetails = await db.get(getPlayerDetailsQuery)
  response.send(getPlayerDetails(playerDetails))
})

//API 3

app.put('/players/:playerId', async (request, response) => {
  const {playerName} = request.body
  const {playerId} = request.params
  const updatePlayerDetailsQuery = `
    UPDATE 
        player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};
    `
  await db.run(updatePlayerDetailsQuery)
  response.send('Player Details Updated')
})

//API 4

const getMatchDetails = dbObj => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  }
}

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const matchDetailsQuery = `
    SELECT 
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};
    `
  const matchDetails = await db.get(matchDetailsQuery)
  response.send(getMatchDetails(matchDetails))
})

//API 5

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const allMatchesPlayersQuery = `
    SELECT 
        match_id,
        match,
        year
    FROM
        match_details NATURAL JOIN player_match_score
    WHERE 
        player_id = ${playerId};
    `
  const allMatchesPlayersArray = await db.all(allMatchesPlayersQuery)
  response.send(
    allMatchesPlayersArray.map(eachPlayer => getMatchDetails(eachPlayer)),
  )
})

//API 6

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const matchPlayersDetailsQuery = `
    SELECT 
        player_id,
        player_name,
    FROM
        player_match_score NATURAL JOIN player_details
    WHERE   
        match_id = ${matchId};
    `
  const allMatchPlayersDetailsArray = await db.all(matchPlayersDetailsQuery)
  response.send(
    allMatchPlayersDetailsArray.map(eachPlayer =>
      allPlayersDetailsArray(eachPlayer),
    ),
  )
})

//API 7

const getDetailsOnPlayerId = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
    totalScore: dbObj.totalScore,
    totalFours: dbObj.totalFours,
    totalSixes: dbObj.totalSixes,
  }
}

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const detailsOnPlayerIdQuery = `
    SELECT 
        player_id,
        player_name,
        totalScore as SUM(score),
        totalFours as SUM(fours),
        totalSixes as SUM(sixes)
    FROM
        player_match_score INNER JOIN player_details
    WHERE 
        player_id = ${playerId};
    `
  const detailsOnPlayerID = await db.get(detailsOnPlayerIdQuery)
  response.send(getDetailsOnPlayerId(detailsOnPlayerID))
})

module.exports = app
