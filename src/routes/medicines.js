import { Router } from "express";

import {
  abdmSearch,
  abdmBrand,
  abdmGeneric,
  abdmSupplier,
  abdmSubstance
} from "../services/abdm.js";

const router = Router();


// ============================================================
// ABDM DRUG -> VANDYCINS MEDICINE FORMAT
// ============================================================

function mapDrugToMedicine(drug) {
  const brandName =
    String(drug?.brandName || "").trim();

  const genericName =
    String(drug?.genericName || "").trim();

  const supplierName =
    String(drug?.supplierName || "").trim();

  const brandIdentifier =
    String(drug?.brandIdentifier || "").trim();

  const genericIdentifier =
    String(drug?.genericIdentifier || "").trim();

  const substanceNames =
    Array.isArray(drug?.substanceName)
      ? drug.substanceName.filter(Boolean)
      : [];

  const substanceIdentifiers =
    Array.isArray(drug?.substanceIdentifier)
      ? drug.substanceIdentifier.filter(Boolean)
      : [];

  /*
   * Android MedicineDto currently expects:
   *
   * id
   * name
   * dosage
   * category
   * price
   * inStock
   * description
   *
   * ABDM does not provide pharmacy price or stock.
   *
   * Therefore:
   * - price = 0 until pharmacy inventory sets actual price
   * - inStock = true means registry record exists,
   *   NOT pharmacy stock availability
   */

  return {
    id: brandIdentifier || genericIdentifier,

    name:
      brandName ||
      genericName ||
      "Unknown medicine",

    dosage:
      genericName ||
      "",

    category:
      substanceNames.join(", ") ||
      genericName ||
      "Medicine",

    price: 0,

    inStock: true,

    description: [
      genericName
        ? `Generic: ${genericName}`
        : null,

      supplierName
        ? `Supplier: ${supplierName}`
        : null,

      substanceNames.length
        ? `Substance: ${substanceNames.join(", ")}`
        : null,

      genericIdentifier
        ? `Generic ID: ${genericIdentifier}`
        : null,

      substanceIdentifiers.length
        ? `Substance ID: ${substanceIdentifiers.join(", ")}`
        : null
    ]
      .filter(Boolean)
      .join(" | ")
  };
}


// ============================================================
// SEARCH
//
// GET /api/v1/medicines/search
//     ?q=Paracetamol
//     &page=0
//     &limit=100
//
// ABDM requires q, page and limit.
// ============================================================

router.get(
  "/search",
  async (req, res, next) => {

    try {

      const q =
        String(req.query.q || "").trim();

      const page =
        Number(req.query.page ?? 0);

      const limit =
        Number(req.query.limit ?? 100);


      // q is mandatory according to ABDM
      if (!q) {

        return res.status(400).json({
          success: false,
          error: "q is required"
        });
      }


      if (
        !Number.isInteger(page) ||
        page < 0
      ) {

        return res.status(400).json({
          success: false,
          error:
            "page must be non-negative integer"
        });
      }


      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {

        return res.status(400).json({
          success: false,
          error:
            "limit must be 1-100"
        });
      }


      console.log(
        `MEDICINE SEARCH: q="${q}" page=${page} limit=${limit}`
      );


      const result =
        await abdmSearch(
          q,
          page,
          limit
        );


      const body =
        result?.body || {};


      const drugs =
        Array.isArray(body.drugDetails)
          ? body.drugDetails
          : [];


      const medicines =
        drugs.map(
          mapDrugToMedicine
        );


      const count =
        Number(body.count || 0);


      console.log(
        `ABDM MEDICINES: received=${medicines.length} total=${count}`
      );


      /*
       * IMPORTANT:
       *
       * Android ApiResponse<T> expects:
       *
       * {
       *   success: true,
       *   data: [...]
       * }
       *
       * So we normalize ABDM response here.
       */

      return res.status(200).json({

        success: true,

        data: medicines,

        count,

        page,

        limit,

        query: q
      });


    } catch (e) {

      console.error(
        "MEDICINE SEARCH ERROR:",
        e
      );

      next(e);
    }
  }
);


// ============================================================
// SEARCH ALL
//
// GET /api/v1/medicines/search-all?q=Paracetamol
//
// Automatically fetches ALL pages from ABDM.
// ============================================================

router.get(
  "/search-all",
  async (req, res, next) => {

    try {

      const q =
        String(req.query.q || "").trim();


      if (!q) {

        return res.status(400).json({
          success: false,
          error: "q is required"
        });
      }


      const limit = 100;

      let page = 0;

      let totalCount = 0;

      const allMedicines = [];


      /*
       * Safety protection.
       *
       * Prevents an infinite loop if ABDM
       * returns an unexpected count.
       */

      const MAX_PAGES = 1000;


      console.log(
        `MEDICINE SEARCH ALL: "${q}"`
      );


      while (page < MAX_PAGES) {

        console.log(
          `ABDM PAGE: ${page}`
        );


        const result =
          await abdmSearch(
            q,
            page,
            limit
          );


        const body =
          result?.body || {};


        const drugs =
          Array.isArray(body.drugDetails)
            ? body.drugDetails
            : [];


        totalCount =
          Number(body.count || 0);


        const medicines =
          drugs.map(
            mapDrugToMedicine
          );


        allMedicines.push(
          ...medicines
        );


        console.log(
          `ABDM PAGE ${page}: ${medicines.length} records`
        );


        /*
         * Nothing returned.
         */
        if (drugs.length === 0) {
          break;
        }


        /*
         * We already received everything.
         */
        if (
          totalCount > 0 &&
          allMedicines.length >= totalCount
        ) {
          break;
        }


        /*
         * Last page.
         */
        if (drugs.length < limit) {
          break;
        }


        page++;
      }


      console.log(
        `MEDICINE SEARCH ALL COMPLETE: fetched=${allMedicines.length} total=${totalCount}`
      );


      return res.status(200).json({

        success: true,

        data: allMedicines,

        count: totalCount,

        fetched: allMedicines.length,

        query: q

      });


    } catch (e) {

      console.error(
        "MEDICINE SEARCH ALL ERROR:",
        e
      );

      next(e);
    }
  }
);


// ============================================================
// BRAND DETAIL
//
// GET /api/v1/medicines/brand/:id
// ============================================================

router.get(
  "/brand/:id",
  async (req, res, next) => {

    try {

      const result =
        await abdmBrand(
          req.params.id
        );


      return res
        .status(result.status)
        .json(result.body);

    } catch (e) {

      next(e);
    }
  }
);


// ============================================================
// GENERIC DETAIL
//
// GET /api/v1/medicines/generic/:id
// ============================================================

router.get(
  "/generic/:id",
  async (req, res, next) => {

    try {

      const result =
        await abdmGeneric(
          req.params.id
        );


      return res
        .status(result.status)
        .json(result.body);

    } catch (e) {

      next(e);
    }
  }
);


// ============================================================
// SUPPLIER
//
// GET /api/v1/medicines/supplier/:id?page=0&limit=100
// ============================================================

router.get(
  "/supplier/:id",
  async (req, res, next) => {

    try {

      const page =
        Number(req.query.page ?? 0);

      const limit =
        Number(req.query.limit ?? 100);


      if (
        !Number.isInteger(page) ||
        page < 0 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {

        return res.status(400).json({
          success: false,
          error:
            "Invalid pagination"
        });
      }


      const result =
        await abdmSupplier(
          req.params.id,
          page,
          limit
        );


      return res
        .status(result.status)
        .json(result.body);

    } catch (e) {

      next(e);
    }
  }
);


// ============================================================
// SUBSTANCE
//
// GET /api/v1/medicines/substance/:id
// ============================================================

router.get(
  "/substance/:id",
  async (req, res, next) => {

    try {

      const result =
        await abdmSubstance(
          req.params.id
        );


      return res
        .status(result.status)
        .json(result.body);

    } catch (e) {

      next(e);
    }
  }
);


export default router;