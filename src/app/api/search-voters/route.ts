import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getValidWards } from '@/lib/ward-config';

// Mark as dynamic to suppress build warnings (this route uses query parameters)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ward = searchParams.get('ward'); // ward_no (e.g., '140', '141', etc.)
    const method = searchParams.get('method'); // '1' for name, '2' for EPIC
    const queryText = searchParams.get('query'); // user input

    // Validate inputs
    if (!ward || !method || !queryText) {
      return NextResponse.json(
        { error: 'Missing required parameters: ward, method, query' },
        { status: 400 }
      );
    }

    // Validate ward against configured ward(s) from URL parameter or environment variables
    const validWards = getValidWards(request);
    
    if (!validWards.includes(ward)) {
      return NextResponse.json(
        { error: `Invalid ward number. Allowed ward(s): ${validWards.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert ward to integer for database query (ward_no is INTEGER in database)
    const wardNumber = parseInt(ward, 10);
    if (isNaN(wardNumber)) {
      return NextResponse.json(
        { error: 'Invalid ward number format' },
        { status: 400 }
      );
    }

    // Validate method
    if (method !== '1' && method !== '2') {
      return NextResponse.json(
        { error: 'Invalid search method. Use 1 for name or 2 for EPIC' },
        { status: 400 }
      );
    }

    let results;
    
    if (method === '1') {
      // Name search - fuzzy matching with trigram similarity for better accuracy
      // Handles word order variations (e.g., "Ram Kumar" matches "Kumar Ram")
      const searchName = queryText.trim();
      
      if (!searchName) {
        return NextResponse.json({
          success: true,
          matches: [],
          count: 0,
        });
      }

      try {
        // Check if pg_trgm extension is available
        const extensionCheck = await query(`
          SELECT EXISTS(
            SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
          ) as extension_exists
        `);
        const hasTrigram = extensionCheck.rows[0]?.extension_exists || false;

        if (hasTrigram) {
          // Use fuzzy search with trigram similarity
          // Search with ALL words using trigram similarity for each word
          const nameWords = searchName.split(/\s+/).filter(w => w.length > 1);
          const exactMatch = `%${searchName}%`;
          
          // Create patterns for all individual words
          const wordPatterns = nameWords.map(w => `%${w}%`);
          const allPatterns = [exactMatch, ...wordPatterns];
          
          // Parameters array: [searchName, exactMatch, word1, word2, word3, ..., wordPattern1, wordPattern2, ..., ward]
          // $1 = searchName (full string for trigram)
          // $2 = exactMatch (%searchName%)
          // $3, $4, $5... = individual words (for trigram similarity)
          // $N+1, $N+2... = word patterns (%word1%, %word2%...)
          // Last param = ward
          
          const wordStartParam = 3; // Words start at $3
          const patternStartParam = wordStartParam + nameWords.length; // Patterns start after words (e.g., if 3 words, patterns start at $6)
          const wardParam = patternStartParam + wordPatterns.length; // Ward comes after all patterns
          
          // Build WHERE conditions - for multi-word searches, require at least 2 words to match
          // For single word, use OR. For multi-word, require multiple matches
          let whereClause = '';
          
          if (nameWords.length === 1) {
            // Single word search - use OR conditions
            const paramNum = wordStartParam;
            const patternParamNum = patternStartParam;
            whereClause = `(
              full_name % $1 
              OR relative_full_name % $1
              OR full_name % $${paramNum}
              OR relative_full_name % $${paramNum}
              OR full_name ILIKE $2
              OR relative_full_name ILIKE $2
              OR full_name ILIKE $${patternParamNum}
              OR relative_full_name ILIKE $${patternParamNum}
            )`;
          } else {
            // Multi-word search - require at least 2 words to match
            // Build conditions for each word (checking both full_name and relation_name)
            const wordConditions = nameWords.map((_, idx) => {
              const paramNum = wordStartParam + idx;
              const patternParamNum = patternStartParam + idx;
              return `(
                full_name % $${paramNum} OR relative_full_name % $${paramNum}
                OR full_name ILIKE $${patternParamNum} OR relative_full_name ILIKE $${patternParamNum}
              )`;
            });
            
            // Require at least 2 words to match using a combination approach
            // For 2 words: (word1 AND word2)
            // For 3 words: (word1 AND word2) OR (word1 AND word3) OR (word2 AND word3)
            // For 4+ words: all pairs
            const combinations = [];
            for (let i = 0; i < nameWords.length; i++) {
              for (let j = i + 1; j < nameWords.length; j++) {
                combinations.push(`(${wordConditions[i]} AND ${wordConditions[j]})`);
              }
            }
            
            // For 3+ words, also allow all 3 words to match (gives better results)
            let allWordsCondition = '';
            if (nameWords.length >= 3) {
              allWordsCondition = ` OR (${wordConditions.join(' AND ')})`;
            }
            
            // Also allow exact full match or high similarity full string match
            // This handles typos in the search query (e.g., "mailk" vs "malik")
            whereClause = `(
              full_name ILIKE $2 OR relative_full_name ILIKE $2
              OR (full_name % $1 AND similarity(full_name, $1) > 0.3)
              OR (relative_full_name % $1 AND similarity(relative_full_name, $1) > 0.3)
              OR ${combinations.join(' OR ')}${allWordsCondition}
            )`;
          }
          
          // Build match score calculation with trigram similarity for EACH word
          const scoreCases = [
            // Full string similarity
            `COALESCE(similarity(full_name, $1), 0)`,
            `COALESCE(similarity(relative_full_name, $1), 0)`,
            // Exact full match
            `CASE WHEN full_name ILIKE $2 THEN 0.95 ELSE 0 END`,
            `CASE WHEN relative_full_name ILIKE $2 THEN 0.85 ELSE 0 END`,
          ];
          
          // Add trigram similarity score for EACH word individually
          nameWords.forEach((_, idx) => {
            const paramNum = wordStartParam + idx; // $3, $4, $5, etc. for each word
            scoreCases.push(`COALESCE(similarity(full_name, $${paramNum}), 0)`);
            scoreCases.push(`COALESCE(similarity(relative_full_name, $${paramNum}), 0)`);
          });
          
          // Add ILIKE pattern scores for each word
          wordPatterns.forEach((_, idx) => {
            const paramNum = patternStartParam + idx; // Patterns start at patternStartParam
            const baseScore = 0.6 - (idx * 0.05);
            scoreCases.push(`CASE WHEN full_name ILIKE $${paramNum} THEN ${baseScore} ELSE 0 END`);
            scoreCases.push(`CASE WHEN relative_full_name ILIKE $${paramNum} THEN ${baseScore - 0.1} ELSE 0 END`);
          });
          
          // Count how many words match - this is critical for multi-word searches
          const wordMatchCount = nameWords
            .map((_, idx) => {
              const paramNum = wordStartParam + idx;
              // Check both trigram match and ILIKE match for each word
              const patternParamNum = patternStartParam + idx;
              return `(
                CASE WHEN full_name % $${paramNum} OR relative_full_name % $${paramNum} 
                     OR full_name ILIKE $${patternParamNum} OR relative_full_name ILIKE $${patternParamNum}
                THEN 1 ELSE 0 END
              )`;
            })
            .join(' + ');
          
          // Heavily boost score when multiple/all words match
          if (nameWords.length > 1) {
            // All words matched - very high boost (highest priority)
            scoreCases.push(`CASE WHEN (${wordMatchCount}) >= ${nameWords.length} THEN 1.0 ELSE 0 END`);
            
            // For 3-word searches, prioritize results with all 3 words
            if (nameWords.length === 3) {
              // All 3 words matched - highest score
              scoreCases.push(`CASE WHEN (${wordMatchCount}) = 3 THEN 0.9 ELSE 0 END`);
              // 2 words matched - good score
              scoreCases.push(`CASE WHEN (${wordMatchCount}) = 2 THEN 0.5 ELSE 0 END`);
            } else {
              // For 2-word or 4+ word searches
              // Most words matched (at least 2/3)
              const twoThirds = Math.ceil(nameWords.length * 0.67);
              if (twoThirds < nameWords.length) {
                scoreCases.push(`CASE WHEN (${wordMatchCount}) >= ${twoThirds} THEN 0.5 ELSE 0 END`);
              }
              // At least half words matched
              scoreCases.push(`CASE WHEN (${wordMatchCount}) >= ${Math.ceil(nameWords.length * 0.5)} THEN 0.3 ELSE 0 END`);
              // At least 2 words matched (for 4+ word searches)
              if (nameWords.length >= 4) {
                scoreCases.push(`CASE WHEN (${wordMatchCount}) >= 2 THEN 0.2 ELSE 0 END`);
              }
            }
          }
          
          // Build query with match scoring for better relevance
          // Order by words_matched first to prioritize results with more words
          const fuzzyQuery = `
            SELECT 
              epic_number,
              full_name,
              age,
              booth_no,
              sr_no,
              locality_street,
              town_village,
              gender,
              GREATEST(${scoreCases.join(', ')}) as match_score,
              (${wordMatchCount}) as words_matched
            FROM voters
            FROM voters
            WHERE 
              ward_no = $${wardParam}
              AND ${whereClause}
            ORDER BY words_matched DESC, match_score DESC, full_name ASC
            LIMIT 50;
          `;
          
          // Build parameters array: [searchName, exactMatch, word1, word2, ..., pattern1, pattern2, ..., wardNumber]
          // Note: exactMatch is already at $2, so we only include wordPatterns (not allPatterns which includes exactMatch)
          const queryParams = [
            searchName,        // $1 - full search string for trigram
            exactMatch,        // $2 - exact pattern
            ...nameWords,      // $3, $4, $5... - individual words for trigram
            ...wordPatterns,   // Patterns for ILIKE (not including exactMatch again)
            wardNumber         // Ward number (integer)
          ];
          
          const fuzzyResult = await query(fuzzyQuery, queryParams);
          
          // Filter results - since WHERE clause already requires 2+ words for multi-word searches,
          // we just need to filter by match score and prioritize by words_matched
          results = fuzzyResult.rows
            .filter(row => row.match_score >= 0.2)
            .sort((a, b) => {
              // First sort by words_matched (descending)
              if (b.words_matched !== a.words_matched) {
                return b.words_matched - a.words_matched;
              }
              // Then by match_score (descending)
              return b.match_score - a.match_score;
            })
            .map(({ match_score, words_matched, ...voter }) => voter); // Remove match_score and words_matched from result
        } else {
          // Fallback to improved ILIKE search with word matching
          const nameWords = searchName.split(/\s+/).filter(w => w.length > 1);
          const exactMatch = `%${searchName}%`;
          const firstWordMatch = nameWords.length > 0 ? `%${nameWords[0]}%` : exactMatch;
          const wordPatterns = nameWords.map(w => `%${w}%`);
          const allPatterns = [exactMatch, firstWordMatch, ...wordPatterns];
          
          // Build WHERE conditions for each pattern (ward is $1, patterns start at $2)
          const whereConditions = allPatterns
            .map((_, idx) => `(full_name ILIKE $${idx + 2} OR relative_full_name ILIKE $${idx + 2})`)
            .join(' OR ');
          
          // Calculate match score based on pattern matches
          const scoreCases = [
            `CASE WHEN full_name ILIKE $2 THEN 10 ELSE 0 END`,
            `CASE WHEN full_name ILIKE $3 THEN 8 ELSE 0 END`,
            `CASE WHEN relation_name ILIKE $2 THEN 7 ELSE 0 END`,
            `CASE WHEN relation_name ILIKE $3 THEN 6 ELSE 0 END`,
          ];
          
          // Add scoring for individual word matches (starting from $4)
          wordPatterns.forEach((_, idx) => {
            const paramNum = idx + 4;
            scoreCases.push(`CASE WHEN full_name ILIKE $${paramNum} THEN ${5 - idx} ELSE 0 END`);
            scoreCases.push(`CASE WHEN relative_full_name ILIKE $${paramNum} THEN ${4 - idx} ELSE 0 END`);
          });
          
          const fallbackQuery = `
            SELECT DISTINCT
              epic_number,
              full_name,
              age,
              booth_no,
              sr_no,
              locality_street,
              town_village,
              gender,
              (${scoreCases.join(' + ')}) as match_score
            FROM voters
            WHERE 
              ward_no = $1
              AND (${whereConditions})
            ORDER BY match_score DESC, full_name ASC
            LIMIT 50;
          `;
          
          const params = [wardNumber, ...allPatterns];
          const fallbackResult = await query(fallbackQuery, params);
          results = fallbackResult.rows
            .filter(row => row.match_score > 0)
            .map(({ match_score, ...voter }) => voter);
        }
      } catch (fuzzyError) {
        // Final fallback to simple ILIKE search
        console.error('Fuzzy search error, falling back to simple search:', fuzzyError);
        const simpleQuery = `
          SELECT 
            epic_number,
            full_name,
            age,
            booth_no,
            sr_no,
            locality_street,
            town_village,
            gender
          FROM voters
          WHERE 
            ward_no = $1
            AND (full_name ILIKE $2 OR relative_full_name ILIKE $2)
          ORDER BY full_name ASC
          LIMIT 50;
        `;
        const searchPattern = `%${searchName}%`;
        const simpleResult = await query(simpleQuery, [wardNumber, searchPattern]);
        results = simpleResult.rows;
      }
    } else {
      // EPIC search - exact match (case-insensitive)
      const searchQuery = `
        SELECT 
          epic_number,
          full_name,
          age,
          booth_no,
          sr_no,
          locality_street,
          town_village,
          gender
        FROM voters
        WHERE ward_no = $1
          AND UPPER(epic_number) = UPPER($2)
        LIMIT 50;
      `;
      const searchPattern = queryText.trim();
      const result = await query(searchQuery, [wardNumber, searchPattern]);
      results = result.rows;
    }

    // Format results for frontend
    const formattedResults = results.map((row, index) => ({
      id: index + 1, // Sequential ID for selection
      name: row.full_name,
      age: row.age || null,
      epic: row.epic_number,
      ward: row.booth_no, // Using booth_no instead of part_no
      sr_no: row.sr_no,
      address: row.locality_street || row.town_village || null,
      house_number: null, // Not in new schema
      gender: row.gender || null,
      pincode: null, // Not in new schema
    }));

    return NextResponse.json({
      success: true,
      matches: formattedResults,
      count: formattedResults.length,
    });

  } catch (error: any) {
    console.error('Search voters error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

