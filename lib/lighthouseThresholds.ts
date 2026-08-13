const lighthouseThresholds = (isProd: boolean) => ({
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: isProd ? 95 : 85, //set SEO score lower on non-prod envs usually due to robots.txt disallow
});
export default lighthouseThresholds;
