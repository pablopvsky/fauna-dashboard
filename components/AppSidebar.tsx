"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  ImageIcon,
  CaretSortIcon,
  CheckIcon,
  LayersIcon,
} from "@radix-ui/react-icons";
import {
  getSidebarMenuIcon,
  type SidebarMenuConfig,
  type SidebarMenuConfigItem,
} from "@/config/sidebar-menu";
import {
  getConnections,
  setActiveConnectionId,
  getAuthHeaders,
  CONNECTION_CHANGED_EVENT,
  type FaunaConnection,
} from "@/utils/fauna-auth-store";

function isLinkItem(
  item: SidebarMenuConfigItem,
): item is Extract<SidebarMenuConfigItem, { url?: string }> {
  return "url" in item && "title" in item;
}

function getActiveTitle(
  menuItems: SidebarMenuConfig,
  pathname: string,
): string {
  let best: string | null = null;
  let bestLen = 0;
  for (const item of menuItems) {
    if (!isLinkItem(item) || item.type === "external") continue;
    const url = item.url;
    if (url && pathname === url) return item.title;
    if (url && pathname.startsWith(url) && url.length > bestLen) {
      best = item.title;
      bestLen = url.length;
    }
  }
  return best ?? "Main content area";
}

type AppSidebarProps = {
  children: React.ReactNode;
  menuItems?: SidebarMenuConfig;
  title?: string;
  defaultOpen?: boolean;
};

export function AppSidebar({
  children,
  menuItems = [],
  title = "Fauna Dashboard",
  defaultOpen = true,
}: AppSidebarProps) {
  const pathname = usePathname();
  const activeTitle = getActiveTitle(menuItems, pathname ?? "");

  const [connections, setConnections] = useState<FaunaConnection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [health, setHealth] = useState<
    "idle" | "checking" | "healthy" | "unhealthy"
  >("idle");

  const refreshConnections = useCallback(() => {
    const { connections: conns, activeId: id } = getConnections();
    setConnections(conns);
    setActiveId(id);
  }, []);

  useEffect(() => {
    refreshConnections();
    const handler = () => refreshConnections();
    window.addEventListener(CONNECTION_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CONNECTION_CHANGED_EVENT, handler);
  }, [refreshConnections]);

  const activeConnection = connections.find((c) => c.id === activeId);
  const activeDatabaseLabel = activeConnection?.name ?? "No database";

  const checkHealth = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!Object.keys(headers).length) {
      setHealth("idle");
      return;
    }
    setHealth("checking");
    try {
      const res = await fetch("/api/health", { headers });
      setHealth(res.ok ? "healthy" : "unhealthy");
    } catch {
      setHealth("unhealthy");
    }
  }, []);

  useEffect(() => {
    if (!activeConnection) {
      setHealth("idle");
      return;
    }
    checkHealth();
    const interval = setInterval(checkHealth, 60 * 1000);
    return () => clearInterval(interval);
  }, [activeConnection?.id, checkHealth]);

  function handleSelectDatabase(id: string) {
    setActiveConnectionId(id);
    window.dispatchEvent(new CustomEvent(CONNECTION_CHANGED_EVENT));
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={`${title} · ${activeDatabaseLabel}`}
                  >
                    <div className="bg-gray-1 p-0.25 border border-gray-a6 flex aspect-square size-2.5 items-center justify-center rounded-md text-accent-1 group-data-[collapsible=icon]:size-3">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 1000 1000"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        xmlSpace="preserve"
                        style={{
                          fillRule: "evenodd",
                          clipRule: "evenodd",
                          strokeLinejoin: "round",
                          strokeMiterlimit: 2,
                        }}
                        aria-hidden
                      >
                        <g transform="matrix(0.1,0,0,-0.1,-908,1268)">
                          <g>
                            <path
                              d="M10890,12224C10890,12221 10903,12201 10918,12181C10934,12161 10994,12075 11052,11990C11109,11905 11238,11716 11337,11570C11436,11424 11564,11235 11622,11150C11680,11065 11793,10898 11874,10780L12021,10565L12178,10548C12264,10538 12441,10519 12570,10506C12699,10492 13030,10456 13305,10426C13580,10396 13904,10362 14025,10350C14146,10338 14255,10327 14267,10324C14280,10322 14321,10281 14365,10224C14407,10171 14443,10130 14445,10132C14447,10134 14471,10189 14500,10255C14528,10321 14557,10389 14565,10405C14572,10422 14604,10496 14635,10570C14667,10644 14707,10740 14726,10783L14759,10860L14732,10874C14717,10882 14644,10909 14570,10935C14496,10960 14365,11006 14280,11035C14195,11065 14060,11112 13980,11140C13900,11168 13792,11207 13740,11225C13688,11243 13593,11277 13530,11300C13416,11341 13191,11420 13115,11445C13093,11452 13003,11484 12915,11515C12827,11546 12719,11585 12675,11600C12116,11796 12064,11815 11910,11870C11788,11914 11606,11978 11425,12040C11365,12061 11297,12085 11275,12093C11253,12102 11181,12127 11115,12150C11049,12173 10974,12200 10948,12211C10898,12232 10890,12233 10890,12224Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M14846,10728C14812,10648 14731,10457 14639,10242L14540,10010L14705,9807C14796,9696 14926,9538 14993,9456C15060,9374 15149,9266 15190,9216C15299,9085 15431,8923 15460,8885C15474,8868 15500,8837 15517,8816L15550,8779L15602,8818C15631,8839 15710,8893 15778,8938C15845,8984 15900,9026 15900,9033C15900,9040 15894,9054 15886,9065C15865,9095 15680,9400 15680,9405C15680,9408 15576,9578 15487,9720C15467,9750 15430,9813 15402,9860C15375,9907 15267,10087 15162,10261C15057,10435 14948,10619 14920,10669C14892,10719 14867,10760 14864,10760C14862,10760 14854,10745 14846,10728Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M9110,10747C9110,10744 9197,10679 9303,10602C9408,10525 9581,10398 9685,10321C9790,10243 9904,10158 9940,10133C9996,10093 10171,9963 10770,9522C10833,9475 10939,9397 11005,9348C11071,9300 11202,9203 11295,9134C11389,9065 11486,8993 11512,8974L11559,8939L11702,9011C11830,9076 12085,9207 12570,9457C12661,9504 12854,9604 13000,9678C13146,9753 13333,9849 13415,9892C13498,9934 13669,10022 13797,10087C13924,10152 14027,10206 14025,10208C14023,10210 13960,10218 13883,10226C13807,10233 13711,10244 13670,10250C13629,10255 13467,10274 13310,10290C13153,10307 12949,10329 12855,10340C12612,10368 12258,10406 12025,10430C11915,10441 11767,10457 11695,10465C10780,10568 9516,10707 9280,10730C9228,10735 9168,10742 9148,10746C9127,10749 9110,10750 9110,10747Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M14105,10101C14089,10092 13972,10031 13845,9966C13719,9901 13570,9824 13515,9795C13460,9766 13271,9670 13095,9580C12919,9491 12739,9398 12695,9375C12651,9352 12507,9277 12375,9210C12243,9142 12027,9031 11895,8962C11763,8893 11645,8832 11633,8826C11620,8820 11610,8813 11610,8810C11610,8801 12241,8471 12633,8275L12812,8185L12836,8215C12871,8260 13267,8792 13410,8988C13479,9082 13538,9159 13542,9160C13546,9160 13517,9107 13478,9043C13423,8951 13111,8412 12953,8133L12929,8091L13615,7235L13627,7300C13633,7336 13664,7502 13695,7670C13726,7838 13760,8020 13770,8075C13781,8130 13832,8409 13884,8695C13936,8981 14002,9337 14030,9485C14058,9634 14095,9827 14111,9915C14127,10003 14142,10085 14145,10098C14151,10123 14146,10124 14105,10101Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M14271,10033C14265,9995 14249,9907 14235,9835C14162,9445 14145,9357 14110,9165C14089,9050 14042,8798 14006,8605C13970,8413 13934,8217 13926,8170C13917,8123 13881,7923 13846,7725C13810,7527 13775,7327 13768,7280L13754,7195L14482,7192C14882,7191 15538,7191 15940,7192L16669,7195L16484,7425C16382,7552 16243,7723 16175,7805C16107,7888 15956,8072 15838,8216C15721,8360 15567,8548 15495,8635C14937,9315 14764,9526 14546,9794C14408,9962 14293,10100 14289,10100C14286,10100 14278,10070 14271,10033Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M17295,9680L17085,9675L17005,9621C16961,9591 16813,9489 16675,9395C16372,9187 16348,9170 15947,8896C15666,8703 15630,8676 15642,8662C15652,8649 15844,8417 15929,8315C15938,8304 15986,8246 16035,8186C16085,8126 16157,8038 16196,7991C16234,7944 16341,7813 16432,7700C16687,7385 16794,7257 16805,7254C16811,7252 16845,7308 16883,7378C16920,7448 17017,7632 17098,7785C17180,7939 17266,8101 17289,8145C17378,8309 17409,8369 17490,8525C17536,8613 17576,8690 17580,8695C17584,8701 17620,8768 17660,8845C17700,8922 17746,9010 17763,9040C17779,9070 17851,9208 17922,9345C17994,9483 18063,9614 18076,9637C18089,9660 18100,9681 18100,9684C18100,9691 17608,9688 17295,9680Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M18204,9592C18193,9574 18128,9451 18020,9245C17986,9179 17933,9078 17902,9020C17872,8962 17844,8911 17839,8906C17834,8900 17830,8892 17830,8888C17830,8884 18109,8880 18450,8880C18791,8880 19070,8883 19070,8888C19070,8892 19048,8907 19022,8921C18996,8935 18901,8990 18812,9043C18722,9096 18647,9140 18646,9140C18644,9140 18585,9174 18515,9215L18386,9290L18306,9444C18261,9529 18223,9601 18220,9604C18217,9607 18210,9601 18204,9592Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M17320,7923C17285,7858 17238,7769 17215,7725C17192,7681 17147,7596 17115,7535C17083,7475 17028,7371 16992,7305C16956,7239 16914,7160 16899,7130C16873,7077 16866,7071 16763,7014C16633,6941 16214,6713 16075,6640C16020,6611 15865,6527 15730,6455C15595,6382 15451,6305 15410,6283C15369,6260 15250,6197 15147,6141C15044,6086 14958,6040 14955,6040C14953,6040 14921,6023 14883,6002C14846,5981 14763,5936 14700,5903C14637,5870 14540,5818 14485,5788C14348,5713 14278,5675 14120,5590C14046,5551 13981,5515 13977,5510C13972,5506 14044,5531 14137,5565C14434,5676 15042,5901 15150,5940C15208,5962 15406,6035 15590,6104C15949,6237 16431,6416 16622,6486C16756,6535 16780,6546 16780,6561C16780,6567 16822,6672 16874,6793C16973,7027 17106,7348 17185,7540C17210,7603 17268,7740 17312,7843C17356,7947 17389,8034 17387,8036C17384,8039 17354,7988 17320,7923Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M13662,6883C13538,6516 13471,6322 13435,6225C13396,6119 13282,5792 13225,5625C13207,5570 13164,5447 13131,5353C13098,5258 13074,5180 13078,5180C13082,5180 13094,5186 13105,5194C13116,5201 13184,5238 13255,5275C13327,5312 13408,5355 13435,5370C13524,5419 13593,5456 13695,5510C13750,5539 13926,5634 14085,5720C14245,5806 14474,5930 14595,5995C14716,6059 14871,6143 14940,6180C15009,6217 15180,6310 15320,6385C15594,6533 15587,6530 15910,6703C16311,6918 16552,7048 16557,7053C16559,7056 15923,7059 15142,7060L13722,7061L13662,6883Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M12591,4965C12134,4049 11760,3296 11760,3294C11760,3289 11976,3401 12273,3557L12421,3636L12599,3930C12696,4092 12848,4342 12935,4485C13264,5025 13348,5165 13345,5168C13344,5169 13318,5158 13289,5142C12994,4983 12860,4916 12853,4924C12847,4930 12939,5211 13120,5740C13192,5952 13255,6136 13260,6150C13269,6177 13348,6399 13400,6539C13416,6585 13428,6625 13426,6628C13423,6630 13047,5882 12591,4965Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M10975,5655C9941,5139 9112,4719 9120,4716C9140,4709 9235,4682 9470,4616C9884,4499 10074,4449 10085,4454C10091,4456 10168,4513 10256,4581C10343,4648 10431,4716 10450,4730C10515,4780 10794,4996 10975,5136C11199,5310 11464,5514 11820,5788C12068,5978 12400,6235 12615,6404C12659,6438 12730,6493 12773,6524C12837,6573 12861,6594 12848,6589C12846,6589 12004,6168 10975,5655Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M12940,6485C12801,6380 12670,6278 12440,6099C12289,5981 11953,5721 11705,5530C11564,5422 11076,5044 10830,4854C10739,4784 10617,4690 10559,4645C10501,4601 10418,4537 10374,4503C10195,4362 10037,4240 9906,4141C9750,4022 9684,3971 9445,3785L9279,3655L9327,3652C9372,3649 9747,3657 10540,3680C10852,3689 10876,3691 10890,3709C10942,3775 11140,4037 11636,4693C11937,5090 12134,5350 12258,5512C12328,5603 12464,5781 12560,5907C12656,6032 12797,6218 12874,6320C12950,6422 13026,6520 13041,6538C13068,6568 13075,6580 13067,6580C13065,6580 13008,6537 12940,6485Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                            <path
                              d="M13077,6372C12996,6264 12900,6137 12864,6090C12828,6043 12740,5929 12669,5835C12599,5742 12435,5526 12306,5355C11872,4784 11783,4667 11509,4304C11358,4105 11156,3839 11060,3714C10965,3588 10837,3420 10777,3340C10717,3260 10658,3185 10647,3173C10620,3142 10631,3135 10672,3156C10690,3165 10752,3194 10810,3220C11004,3307 11494,3531 11600,3581C11658,3609 11727,3641 11754,3652L11802,3673L12150,4374C12341,4760 12627,5336 12786,5655C13200,6487 13241,6570 13232,6570C13228,6570 13159,6481 13077,6372Z"
                              fill="rgb(5,62,226)"
                              fillRule="nonzero"
                            />
                          </g>
                        </g>
                      </svg>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-medium">{title}</span>
                      <span className="truncate text-xs text-gray-11">
                        {activeDatabaseLabel}
                      </span>
                    </div>
                    <CaretSortIcon className="icon ml-auto group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-19">
                  <DropdownMenuLabel className="text-gray-11">
                    {" "}
                    Databases
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {connections.length === 0 ? (
                    <DropdownMenuItem disabled className="text-gray-11">
                      No databases added. Add one on the Auth page.
                    </DropdownMenuItem>
                  ) : (
                    connections.map((conn) => (
                      <DropdownMenuItem
                        key={conn.id}
                        onClick={() => handleSelectDatabase(conn.id)}
                      >
                        {conn.id === activeId ? (
                          <CheckIcon className="icon mr-2" aria-hidden />
                        ) : (
                          <span className="mr-2 w-[1em]" aria-hidden />
                        )}
                        {conn.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Menu
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map((item, i) => {
                if (item.type === "separator") {
                  return (
                    <div
                      key={`sep-${i}`}
                      className="my-1 h-px bg-gray-6 w-full"
                      aria-hidden
                    />
                  );
                }
                if (
                  item.type === "external" &&
                  "url" in item &&
                  "title" in item
                ) {
                  const Icon = getSidebarMenuIcon(item.icon);
                  return (
                    <SidebarMenuItem key={`${item.url}-${i}`}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {Icon ? <Icon className="icon" /> : null}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                if (isLinkItem(item)) {
                  const Icon = getSidebarMenuIcon(item.icon);
                  const isActive =
                    pathname === item.url ||
                    (item.url !== "/" && pathname?.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={`${item.url}-${i}`}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        <Link href={item.url}>
                          {Icon ? <Icon className="icon" /> : null}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                return null;
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter></SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-0">
        <header className="flex h-4 shrink-0 items-center gap-2 border-b border-gray-6 px-1">
          <SidebarTrigger />
          <div className="h-2.5 w-px bg-gray-6" />
          <span className="text-sm text-gray-11">{activeTitle}</span>
          {activeConnection && (
            <>
              <div className="ml-auto h-2.5 w-px bg-gray-6" />
              <Badge
                status={
                  health === "healthy"
                    ? "success"
                    : health === "unhealthy"
                      ? "danger"
                      : undefined
                }
                className="gap-1"
                role="status"
                aria-live="polite"
                aria-label={
                  health === "checking"
                    ? "Checking database health"
                    : health === "healthy"
                      ? "Database healthy"
                      : health === "unhealthy"
                        ? "Database unhealthy"
                        : "Health status"
                }
              >
                <span
                  className={`size-0.5 shrink-0 rounded-full ${
                    health === "healthy"
                      ? "bg-success-contrast"
                      : health === "unhealthy"
                        ? "bg-danger-contrast"
                        : "bg-gray-8"
                  }`}
                  aria-hidden
                />
                {health === "checking"
                  ? "Checking…"
                  : health === "healthy"
                    ? "Healthy"
                    : health === "unhealthy"
                      ? "Unhealthy"
                      : "—"}
              </Badge>
            </>
          )}
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-0.5">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
