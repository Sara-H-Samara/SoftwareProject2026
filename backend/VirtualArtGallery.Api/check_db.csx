using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using VirtualArtGallery.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using System.IO;

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.Development.json")
    .Build();

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));

using var db = new ApplicationDbContext(optionsBuilder.Options);

var artworks = await db.Artworks.ToListAsync();
Console.WriteLine($"Total artworks: {artworks.Count}");

foreach (var a in artworks)
{
    Console.WriteLine($"ID: {a.Id}, ArtistID: {a.ArtistId}, IsPublished: {a.IsPublished}, Title: {a.Title}");
}
